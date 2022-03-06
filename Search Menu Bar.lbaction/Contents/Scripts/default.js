// LaunchBar Action Script

function run(argument) {
    let appleScriptResult = LaunchBar.executeAppleScript(
        'tell application "System Events" to tell (process 1 where frontmost is true)',
        "	tell menu bar 1",
        '		return entire contents of menu bar items whose name is not "Apple"',
        "	end tell",
        "end tell"
    );

    const mainMenuBarItems = {};
    let regex = /menu item (\w+.*?) of menu (\w+.*?) of menu bar item (\w+.*?) of menu bar 1 of application process/;
    let lines = appleScriptResult.split(",");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const matches = regex.exec(line);
        if (matches !== null) {
            const mainMenuBarItemName = matches[3];
            const menuItemName = matches[1];
            if (!isNaN(menuItemName)) {
                continue;
            }

            if (!line) {
                continue;
            }

            if (!line.trim().startsWith("menu item ")) {
                continue;
            }

            if (!(mainMenuBarItemName in mainMenuBarItems)) {
                mainMenuBarItems[mainMenuBarItemName] = [];
            }

            const middleLevels = matches[2];
            if (middleLevels.indexOf(" of menu item ") < 0) {
                mainMenuBarItems[mainMenuBarItemName].push(menuItemName);
            } else {
                let middleLevelsLine = middleLevels;
                let startIndex = 0;
                let index = middleLevelsLine.indexOf(" of menu item ");
                let previousMenuItem = menuItemName;

                while (index >= 0) {
                    const menuItem = {};
                    menuItem[middleLevelsLine.substring(startIndex, index).trim()] = previousMenuItem;

                    middleLevelsLine = middleLevelsLine.substring(index + " of menu item ".length);
                    startIndex = middleLevelsLine.indexOf(" of menu ") + " of menu ".length;
                    index = middleLevelsLine.indexOf(" of menu item ");
                    previousMenuItem = menuItem;
                }

                mainMenuBarItems[mainMenuBarItemName].push(previousMenuItem);
            }
        }
    }

    const results = [];
    for (const key in mainMenuBarItems) {
        if (Object.hasOwnProperty.call(mainMenuBarItems, key)) {
            const mainMenuBarItem = mainMenuBarItems[key];

            for (let i = 0; i < mainMenuBarItem.length; i++) {
                const element = mainMenuBarItem[i];
                buildLaunchBarResults(results, { title: key, levels: [key] }, element);
            }
        }
    }

    return results;
}

function buildLaunchBarResults(results, parent, item) {
    if (typeof item === "string") {
        const levels = parent.levels;
        levels.push(item);

        return results.push({
            title: parent.title + " > " + item,
            action: "click",
            actionArgument: { levels: levels },
        });
    } else {
        for (const key in item) {
            if (Object.hasOwnProperty.call(item, key)) {
                const menuItem = item[key];
                parent.title = parent.title + " > " + key;
                parent.levels.push(key);

                buildLaunchBarResults(results, parent, menuItem);
            }
        }
    }
}

function click(data) {
    LaunchBar.hide();

    let appleScript =
        'tell application "System Events" to tell (process 1 where frontmost is true) \n' +
        `    tell menu bar item "${data.levels[0]}" of menu bar 1 \n` +
        "        click \n" +
        `        click menu item "${data.levels[1]}" of menu 1 \n`;

    for (let i = 2; i < data.levels.length; i++) {
        let menuOfMenu = "";
        let isFirst = true;
        for (let j = i; j > 1; j--) {
            const current = data.levels[j];
            const previous = data.levels[j - 1];
            if (isFirst) {
                menuOfMenu += `"${current}" of menu 1 of menu item "${previous}"`;
                isFirst = false;
            } else {
                menuOfMenu += ` of menu 1 of menu item "${previous}"`;
            }
        }

        appleScript += `        click menu item ${menuOfMenu} of menu 1 \n`;
    }

    appleScript += "    end tell \n" + "end tell";

    LaunchBar.executeAppleScript(appleScript);
}
