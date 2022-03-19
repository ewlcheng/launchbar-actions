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
    let lines = appleScriptResult.split(",");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line.startsWith("menu item ")) {
            continue;
        }

        if (line.indexOf(" of menu bar 1 of application") < 0) {
            continue;
        }

        const mainMenuBarItemName = line.substring(
            line.indexOf(" of menu bar item ") + " of menu bar item ".length,
            line.indexOf(" of menu bar 1 of application")
        );

        const menuItemName = line.substring("menu item ".length, line.indexOf(" of menu "));
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

        const middleLevels = line.substring(
            line.indexOf(" of menu ") + " of menu ".length,
            line.indexOf(" of menu bar item ")
        );
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

    let appleScript = 'tell application "System Events" to tell (process 1 where frontmost is true) \n';
    for (let i = data.levels.length - 1; i >= 0; i--) {
        if (i === data.levels.length - 1) {
            appleScript += `    click menu item "${data.levels[i]}" of menu 1 `;
        } else if (i === 0) {
            appleScript += `of menu bar item "${data.levels[i]}" of menu bar 1 \n`;
        } else {
            appleScript += `of menu item "${data.levels[i]}" of menu 1 `;
        }
    }

    appleScript += "end tell";

    LaunchBar.executeAppleScript(appleScript);
}
