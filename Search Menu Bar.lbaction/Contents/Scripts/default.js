// LaunchBar Action Script

function run(argument) {
    let appleScriptResult = LaunchBar.executeAppleScript(
        'tell application "System Events" to tell (process 1 where frontmost is true)',
        "	tell menu bar 1",
        '		get every menu item of every menu of (every menu bar item whose name is not "Apple")',
        "	end tell",
        "end tell"
    );

    const mainMenuBarItems = {};
    let regex = /menu item (\w+.*) of menu (\w+.*) of menu bar item (\w+.*) of menu bar 1 of application process/;
    let lines = appleScriptResult.split(",");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const matches = regex.exec(line);
        if (matches !== null) {
            const mainMenuBarItemName = matches[2];
            const menuItemName = matches[1];
            if (!isNaN(menuItemName)) {
                continue;
            }

            if (!(mainMenuBarItemName in mainMenuBarItems)) {
                mainMenuBarItems[mainMenuBarItemName] = {};
            }

            mainMenuBarItems[mainMenuBarItemName][menuItemName] = [];
        }
    }

    appleScriptResult = LaunchBar.executeAppleScript(
        'tell application "System Events" to tell (process 1 where frontmost is true)',
        "	tell menu bar 1",
        '		get every menu item of every menu of every menu item of every menu of (every menu bar item whose name is not "Apple")',
        "	end tell",
        "end tell"
    );

    regex =
        /menu item (\w+.*) of menu (\w+.*) of menu item (\w+.*) of menu (\w+.*) of menu bar item (\w+.*) of menu bar 1 of application process/;
    lines = appleScriptResult.split(",");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
            continue;
        }

        const matches = regex.exec(line);
        if (matches !== null) {
            const mainMenuBarItemName = matches[4];
            const menuItemName = matches[2];
            const menuItem2Name = matches[1];
            if (!isNaN(menuItem2Name)) {
                continue;
            }

            mainMenuBarItems[mainMenuBarItemName][menuItemName].push(menuItem2Name);
        }
    }

    const results = [];
    for (const key in mainMenuBarItems) {
        if (Object.hasOwnProperty.call(mainMenuBarItems, key)) {
            const mainMenuBarItem = mainMenuBarItems[key];

            for (const menuItemKey in mainMenuBarItem) {
                if (Object.hasOwnProperty.call(mainMenuBarItem, menuItemKey)) {
                    const menuItems = mainMenuBarItem[menuItemKey];
                    if (menuItems.length) {
                        for (let i = 0; i < menuItems.length; i++) {
                            const menuItem = menuItems[i];
                            results.push({
                                title: key + " > " + menuItemKey + " > " + menuItem,
                                action: "click",
                                actionArgument: { menuBarItem: key, menuItem: menuItemKey, menuItem2: menuItem },
                            });
                        }
                    } else {
                        results.push({
                            title: key + " > " + menuItemKey,
                            action: "click",
                            actionArgument: { menuBarItem: key, menuItem: menuItemKey },
                        });
                    }
                }
            }
        }
    }

    return results;
}

function click(data) {
    LaunchBar.hide();

    if ("menuItem2" in data) {
        LaunchBar.executeAppleScript(
            'tell application "System Events" to tell (process 1 where frontmost is true)',
            `    tell menu bar item "${data.menuBarItem}" of menu bar 1`,
            "        click",
            `        click menu item "${data.menuItem}" of menu 1`,
            `        click menu item "${data.menuItem2}" of menu 1 of menu item "${data.menuItem}" of menu 1`,
            "    end tell",
            "end tell"
        );
    } else {
        LaunchBar.executeAppleScript(
            'tell application "System Events" to tell (process 1 where frontmost is true)',
            `    tell menu bar item "${data.menuBarItem}" of menu bar 1`,
            "        click",
            `        click menu item "${data.menuItem}" of menu 1`,
            "    end tell",
            "end tell"
        );
    }
}
