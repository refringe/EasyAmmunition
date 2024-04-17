# Easy Ammunition

This is a mod for [Single Player Tarkov](https://www.sp-tarkov.com/).

Assign background colours to ammunition items based on their penetration values. This allows players to quickly identify the best ammunition without having a PHD in ammunition engineering. This mod is a streamlined server-side adaptation of [Faupi - Munitions Expert](https://hub.sp-tarkov.com/files/file/554-faupi-munitions-expert/)​.

This mod is compatible with [Color Converter API](https://hub.sp-tarkov.com/files/file/1509-color-converter-api/). This server-side mod will allow you to use hex colour codes to assign background colours. It's highly recommended, but not required.

**Vanilla:**

![Before Mod](https://raw.githubusercontent.com/refringe/EasyAmmunition/master/images/Vanilla.png)

**Easy Ammunition Default:**

![After Mod](https://raw.githubusercontent.com/refringe/EasyAmmunition/master/images/Default.png)

**Easy Ammunition Default with [Color Converter API](https://hub.sp-tarkov.com/files/file/1509-color-converter-api/):**

![With Color Converter API](https://raw.githubusercontent.com/refringe/EasyAmmunition/master/images/ColorConverter.png)

_All background colours and penetration values can be adjusted._

# To install:

1. Decompress the contents of the download into your root SPT directory.
2. Open the `EasyAmmunition/config/config.json5` file to adjust configuration options.
    - The configuration file is in **JSON5** format. The file extension is not a mistake. **_Do not rename it!_**
3. Optionally, install [Color Converter API](https://hub.sp-tarkov.com/files/file/1509-color-converter-api/) (highly recommended).
4. Leave a review and let me know what you think.

If you experience any problems, please [submit a detailed bug report](https://github.com/refringe/EasyAmmunition/issues).

# To Build Locally:

This project has been built in [Visual Studio Code](https://code.visualstudio.com/) (VSC) using [Node.js](https://nodejs.org/). If you are unfamiliar with Node.js, I recommend using [NVM](https://github.com/nvm-sh/nvm) to manage installation and switching versions. If you do not wish to use NVM, you will need to install the version of Node.js listed within the `.nvmrc` file manually.

This project uses [Prettier](https://prettier.io/) to format code on save.

To build the project locally:

1. Clone the repository.
2. Open the `mod.code-workspace` file in Visual Studio Code (VSC).
3. Install the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) VSC extension.
4. Install the [JSON5](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-json5) VSC extension.
5. Run `nvm use` in the terminal.
6. Run `npm install` in the terminal.
7. Run `npm run build` in the terminal.
