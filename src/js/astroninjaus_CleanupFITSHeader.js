#feature-id  astroninja.us > Cleanup FITS Headers

#define ID                 "CleanupFITSHeaders"
#define TITLE              "Cleanup FITS Headers"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info remove all HISTORY FITS headers


function main()
{
    Console.show();

    var window = ImageWindow.activeWindow;

    if ( window.isNull )
    {
       errMessage( "No active image" );
       return;
    }

    var keycount = window.keywords.length;

    Console.writeln("Found keywords: " + keycount);
    Console.writeln("Removing keywords with name 'HISTORY'.  This could take a while...")
    Console.flush()

    // remove "HISTORY" since it is slowing down EVERYTHING
    var newKeywords = [];
    
    var i = 0
    while (i < window.keywords.length)
    {
        var k = window.keywords[i];
        if (k.name != "HISTORY") {
            newKeywords.push(k);
        }
        i++;
    }

    Console.writeln("Removing keywords: " + (keycount - newKeywords.length))

    window.keywords = newKeywords;

    Console.writeln("New keyword count: " + window.keywords.length)
}

main();

