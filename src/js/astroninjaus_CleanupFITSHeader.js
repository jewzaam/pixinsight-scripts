//
// CleanupFITSHeader, remove FITS headers that are not useful and slow down other processing steps
//
// Copyright Naveen Malik, 2021
//
// History
//      2021-08-15     0.0.1   First release, removes all HISTORY headers.
//       

#feature-id  jewzaam > Cleanup FITS Header

#define ID                 "CleanupFITSHeader"
#define TITLE              "Cleanup FITS Header"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

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

