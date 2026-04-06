namespace EasyAmmunition.Models;

public record Configuration
{
    public required GeneralSettings General { get; init; }
    public required List<PenetrationConfig> Penetration { get; init; }
}

public record GeneralSettings
{
    public bool Enabled { get; init; } = true;
    public bool Debug { get; init; }
}

public record PenetrationConfig
{
    public required PenetrationRange Range { get; init; }
    public required ColourShade Colour { get; init; }
}

public record PenetrationRange
{
    public int Min { get; init; }
    public int Max { get; init; }
}

public record ColourShade
{
    public required string High { get; init; }
    public required string Low { get; init; }
}
