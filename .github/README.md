# Easy Ammunition

This is a mod for [Single Player Tarkov](https://www.sp-tarkov.com/).

Assign background colours to ammunition items based on their penetration values. This allows players to quickly identify the best ammunition without having a PHD in ammunition engineering. This mod is a streamlined server-side adaptation of [Faupi - Munitions Expert](https://hub.sp-tarkov.com/files/file/554-faupi-munitions-expert/).

This mod requires [Color Converter API](https://hub.sp-tarkov.com/files/file/1509-color-converter-api/) to be installed.

**Vanilla:**

![Before Mod](https://raw.githubusercontent.com/refringe/EasyAmmunition/master/images/Vanilla.png)

**Easy Ammunition:**

![With Color Converter API](https://raw.githubusercontent.com/refringe/EasyAmmunition/master/images/ColorConverter.png)

_All background colours and penetration values can be adjusted._

# To install:

1. Install [Color Converter API](https://hub.sp-tarkov.com/files/file/1509-color-converter-api/).
2. Decompress the contents of the download into your root SPT directory.
3. Optionally, open the `SPT/user/mods/Refringe-EasyAmmunition/config.json` file to adjust configuration.
4. Let me know what you think.

If you experience any problems, please [submit a detailed bug report](https://github.com/refringe/EasyAmmunition/issues).

# To Build Locally:

This project is built with [.NET 9.0](https://dotnet.microsoft.com/).

1. Clone the repository.
2. Run `dotnet build -c Release` from the project directory.
3. The build produces `bin/Release/Refringe-EasyAmmunition.zip`.
4. Extract the zip into your root SPT directory.
