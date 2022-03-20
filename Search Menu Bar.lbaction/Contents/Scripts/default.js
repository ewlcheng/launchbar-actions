// LaunchBar Action Script

function run(argument) {
    const appleScriptResult = LaunchBar.executeAppleScript(
        'tell application "System Events" to tell (process 1 where frontmost is true)',
        "   tell menu bar 1",
        "       return entire contents of menu bar items",
        "   end tell",
        "end tell"
    );

    const lines = appleScriptResult.split(", menu item ");

    const results = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        const menuBar1Index = line.indexOf(" of menu bar 1 of application");
        if (menuBar1Index < 0) {
            continue;
        }

        const mainMenuBarItemName = line.substring(
            line.indexOf(" of menu bar item ") + " of menu bar item ".length,
            menuBar1Index
        );

        if (mainMenuBarItemName === "Apple") {
            continue;
        }

        const menuItemName = line.startsWith("menu item ")
            ? line.substring("menu item ".length, line.indexOf(" of menu "))
            : line.substring(0, line.indexOf(" of menu "));
        if (!isNaN(menuItemName)) {
            continue;
        }

        if (!line) {
            continue;
        }

        const middleLevels = line.substring(
            line.indexOf(" of menu ") + " of menu ".length,
            line.indexOf(" of menu bar item ")
        );
        if (middleLevels.indexOf(" of menu item ") < 0) {
            results.push({
                title: mainMenuBarItemName + " > " + menuItemName,
                icon: "iconTemplate",
                action: "click",
                actionArgument: { levels: [mainMenuBarItemName, menuItemName] },
                actionRunsInBackground: true,
            });
        } else {
            let middleLevelsLine = middleLevels;
            let startIndex = 0;
            let index = middleLevelsLine.indexOf(" of menu item ");

            const levels = [menuItemName];
            while (index >= 0) {
                levels.splice(0, 0, middleLevelsLine.substring(startIndex, index).trim());

                middleLevelsLine = middleLevelsLine.substring(index + " of menu item ".length);
                startIndex = middleLevelsLine.indexOf(" of menu ") + " of menu ".length;
                index = middleLevelsLine.indexOf(" of menu item ");
            }

            levels.splice(0, 0, mainMenuBarItemName);

            results.push({
                title: levels.join(" > "),
                icon: "iconTemplate",
                action: "click",
                actionArgument: { levels: levels },
                actionRunsInBackground: true,
            });
        }
    }

    return results;
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
