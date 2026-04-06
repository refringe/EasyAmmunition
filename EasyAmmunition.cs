using System.Reflection;
using EasyAmmunition.Models;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Services;

namespace EasyAmmunition;

public record ModMetadata : AbstractModMetadata
{
    public override string ModGuid { get; init; } = "com.refringe.easyammunition";
    public override string Name { get; init; } = "EasyAmmunition";
    public override string Author { get; init; } = "Refringe";
    public override List<string>? Contributors { get; init; }
    public override SemanticVersioning.Version Version { get; init; } = new("2.0.0");
    public override SemanticVersioning.Range SptVersion { get; init; } = new("~4.0.0");
    
    public override List<string>? Incompatibilities { get; init; }
    public override Dictionary<string, SemanticVersioning.Range>? ModDependencies { get; init; }
    public override string? Url { get; init; } = "https://github.com/refringe/EasyAmmunition";
    public override bool? IsBundleMod { get; init; }
    public override string License { get; init; } = "MIT";
}

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class EasyAmmunition(ISptLogger<EasyAmmunition> logger, DatabaseService databaseService, ItemBaseClassService itemBaseClassService, ModHelper modHelper) : IOnLoad
{
    public Task OnLoad()
    {
        var pathToMod = modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());
        Configuration config;
        try
        {
            config = modHelper.GetJsonDataFromFile<Configuration>(pathToMod, "config.json");
        }
        catch (Exception ex)
        {
            logger.Error($"[EasyAmmunition] Failed to load configuration: {ex.Message}");
            return Task.CompletedTask;
        }

        if (!config.General.Enabled)
        {
            logger.Warning("[EasyAmmunition] Easy Ammunition is disabled in the configuration.");
            return Task.CompletedTask;
        }

        var items = databaseService.GetItems();
        var changeCount = 0;

        foreach (var (id, item) in items)
        {
            if (item.Properties is null)
            {
                continue;
            }

            if (!itemBaseClassService.ItemHasBaseClass(id, BaseClasses.AMMO))
            {
                continue;
            }

            if (item.Properties.AmmoType is not ("bullet" or "buckshot"))
            {
                continue;
            }

            if (item.Properties.PenetrationPower is null)
            {
                continue;
            }

            if (item.Name?.StartsWith("shrapnel") == true)
            {
                continue;
            }

            var penetration = item.Properties.PenetrationPower.Value;
            var colour = ResolveBackgroundColour(penetration, config.Penetration);

            if (colour is null)
            {
                continue;
            }

            item.Properties.BackgroundColor = colour;
            changeCount++;

            if (config.General.Debug)
            {
                logger.Debug($"[EasyAmmunition] Ammo {item.Name} (pen {penetration}) -> {colour}");
            }
        }

        logger.Success($"[EasyAmmunition] Adjusted the background colour of {changeCount} types of ammunition.");
        return Task.CompletedTask;
    }

    private static string? ResolveBackgroundColour(int penetration, List<PenetrationConfig> configs)
    {
        foreach (var config in configs)
        {
            if (penetration >= config.Range.Min && penetration <= config.Range.Max)
            {
                return InterpolateColour(penetration, config);
            }
        }

        return null;
    }

    private static string InterpolateColour(int penetration, PenetrationConfig config)
    {
        var range = config.Range.Max - config.Range.Min;
        var amt = range == 0 ? 0.0 : (double)(penetration - config.Range.Min) / range;

        var startRgb = HexToRgb(config.Colour.High);
        var endRgb = HexToRgb(config.Colour.Low);

        var r = (int)Math.Round((1 - amt) * startRgb.R + amt * endRgb.R);
        var g = (int)Math.Round((1 - amt) * startRgb.G + amt * endRgb.G);
        var b = (int)Math.Round((1 - amt) * startRgb.B + amt * endRgb.B);

        return $"#{r:X2}{g:X2}{b:X2}";
    }

    private static (int R, int G, int B) HexToRgb(string hex)
    {
        var h = hex.TrimStart('#');
        if (h.Length == 3)
        {
            h = $"{h[0]}{h[0]}{h[1]}{h[1]}{h[2]}{h[2]}";
        }

        return (
            Convert.ToInt32(h[..2], 16),
            Convert.ToInt32(h[2..4], 16),
            Convert.ToInt32(h[4..6], 16)
        );
    }
}
