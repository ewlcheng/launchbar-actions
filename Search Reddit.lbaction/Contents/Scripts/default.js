// LaunchBar Action Script

const redditUrl = "https://www.reddit.com";

function run(argument) {
    if (argument == undefined) {
        LaunchBar.alert("No argument was passed to the action");
        return;
    }

    let query = null;
    let sort = "";
    if (typeof argument === "object") {
        query = parseQuery(argument.query);
        sort = argument.sort;
    } else {
        query = parseQuery(argument);
    }

    const result = HTTP.getJSON(createSearchUrl(query.subreddit, true, query.query, "", 10, sort));
    const searchUrl = createSearchUrl(query.subreddit, false, query.query, "", 0, sort);

    if (result.error != undefined) {
        LaunchBar.alert("Unable to search Reddit", result.error);
    }

    if (result.data != undefined && result.data.data && result.data.data.children) {
        const launchBarResults = [];

        const thumbnailRequests = [];
        for (let i = 0; i < result.data.data.children.length; i++) {
            const data = result.data.data.children[i].data;

            if (data.thumbnail.startsWith("https://")) {
                data.thumbnailRequestIndex = thumbnailRequests.length;
                thumbnailRequests.push(HTTP.createGetDataRequest(data.thumbnail));
            } else {
                data.thumbnailRequestIndex = -1;
            }
        }

        const thumbnails = HTTP.loadRequests(thumbnailRequests);

        for (let i = 0; i < result.data.data.children.length; i++) {
            const data = result.data.data.children[i].data;

            let thumbnail = "";
            if (data.thumbnailRequestIndex > -1) {
                const thumbnailResult = thumbnails[data.thumbnailRequestIndex];
                if (thumbnailResult.response.status == 200 && thumbnailResult.data != undefined) {
                    thumbnail = "data:image/png;base64," + thumbnailResult.data.toBase64String();
                } else if (thumbnailResult.error != undefined) {
                    LaunchBar.log("Unable to load the icon: " + data.thumbnail, thumbnailResult.error);
                } else {
                    LaunchBar.log(
                        "Unable to load the icon: " + data.thumbnail,
                        thumbnailResult.response.localizedStatus
                    );
                }
            }

            launchBarResults.push({
                title: data.title,
                label: "r/" + data.subreddit,
                subtitle: "Posted " + new Date(data.created_utc * 1000).toLocaleString(),
                url: joinUrl(redditUrl, data.permalink),
                icon: thumbnail,
            });
        }

        if (launchBarResults.length) {
            launchBarResults.push({
                title: "Sort by...",
                children: [
                    {
                        title: "Relevance",
                        action: "run",
                        actionArgument: { query: argument, sort: "relevance" },
                    },
                    { title: "Hot", action: "run", actionArgument: { query: argument, sort: "hot" } },
                    { title: "Top", action: "run", actionArgument: { query: argument, sort: "top" } },
                    { title: "Latest", action: "run", actionArgument: { query: argument, sort: "new" } },
                    { title: "Comments", action: "run", actionArgument: { query: argument, sort: "comments" } },
                ],
            });
        }

        launchBarResults.push({ title: "Show all results on Reddit", url: searchUrl });

        return launchBarResults;
    }
}

function parseQuery(query) {
    var splitQuery = query.split(" ");
    let newQuery = "";
    let subreddit = "";
    for (let i = 0; i < splitQuery.length; i++) {
        const element = splitQuery[i];
        if (element.startsWith("r/")) {
            subreddit = element;
        } else {
            newQuery += element + " ";
        }
    }

    newQuery = newQuery.trim();

    return {
        subreddit: subreddit,
        query: newQuery,
    };
}

function createSearchUrl(subreddit = "", json = false, query = "", type = "", limit = 0, sort = "") {
    let url = redditUrl;

    if (subreddit) {
        url = joinUrl(url, subreddit);
    }

    if (query) {
        url = joinUrl(url, json ? "search.json" : "search");
    } else {
        url = url + (json ? ".json" : "");
    }

    if (subreddit || query || type || limit || sort) {
        const params = [];

        if (subreddit) {
            params.push({ key: "restrict_sr", value: "true" });
        }

        if (query) {
            params.push({ key: "q", value: query });
        }

        if (type) {
            params.push({ key: "type", value: type });
        }

        if (limit) {
            params.push({ key: "limit", value: limit.toString() });
        }

        if (sort) {
            params.push({ key: "sort", value: sort });
        }

        const queryParameters = params.reduce(function (previous = "", current) {
            return previous + "&" + current.key + "=" + encodeURIComponent(current.value);
        }, "");

        url = url + "?" + queryParameters;
    }

    return url;
}

function joinUrl(part1, part2) {
    const p1 = part1.endsWith("/") ? part1.substring(0, part1.length - 1) : part1;
    const p2 = part2.startsWith("/") ? part2.substring(1) : part2;
    return p1 + "/" + p2;
}
