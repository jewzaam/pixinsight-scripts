#feature-id  astroninja.us > Copy Headers

#define ID                 "CopyHeaders"
#define TITLE              "Copy Headers"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info copy most heards to the target image from another image (i.e. to get atmospheric solution)


function main()
{
    Console.show();

    var window = ImageWindow.activeWindow;

    if ( window.isNull )
    {
       errMessage( "No active image" );
       return;
    }

    // find a good target window by finding DATE-OBS header
    var sourceWindow;
    var allWindows = ImageWindow.windows;
    for (var i in allWindows) {
        var w = allWindows[i]
        var j = 0
        while (j < w.keywords.length)
        {
            if (w.keywords[j].name == "DATE-OBS") {
                sourceWindow = w;
                break;
            }
            j++;
        }
        if (sourceWindow) {
            Console.writeln(format("Found candidate source image: %s",sourceWindow.mainView.id))
            break
        }
    }

    // Copy all but the following:
    // COMMENT
    // FILTER
    // HISTORY
    
    var keycount = sourceWindow.keywords.length;
    var newKeywords = []

    var i = 0
    while (i < keycount)
    {
        var k = sourceWindow.keywords[i];
        if (k.name != "COMMENT" && k.name != "FILTER" && k.name != "HISTORY") {
            newKeywords.push(k);
        }
        i++;
    }

    window.keywords = newKeywords;

    Console.writeln("New keyword count: " + window.keywords.length)
}

main();

