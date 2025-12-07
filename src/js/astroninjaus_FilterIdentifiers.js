#feature-id  astroninja.us > Filter Identifier

#define ID                 "FilterIdentifier"
#define TITLE              "Filter Identifier"
#define VERSION            "0.0.2"
#define AUTHOR             "Naveen Malik"

#feature-info rename view to FILTER FITS header value

function getKeyValue(window, keyName)
{
   for (var i in window.keywords)
   {
      with (window.keywords[i])
      {
         if (name == keyName)
         {
            return value;
         }
      }
   }
   return null;
}

function processView(window, view) {
    var oldId = view.id;

    // get filter name
    var filter = getKeyValue(window, 'FILTER');
    if (!filter) {
        return false; // Skip views without FILTER
    }

    // it will have single quotes around it, strip those
    filter = filter.substring(1, filter.length - 1);

    if (!filter) {
        return false; // Skip if filter is empty after stripping quotes
    }


   var viewName = format("%s", filter);
   
   // Check for panel number in OBJECT header (format: " Panel NNN")
   var object = getKeyValue(window, 'OBJECT');
   if (object) {
      // Look for " Panel NNN" pattern and extract the number (handles quotes in regex)
      var panelMatch = object.match(/['"]?.* Panel (\d+)/);
      if (panelMatch) {
         var panelNumber = panelMatch[1];
         viewName = format("%s_p%s", viewName, panelNumber);
      }
   }
   
   view.id = viewName;

   Console.writeln(format("Renamed '%s' to '%s'!", oldId, view.id));
   return true;
}

function mainFilterIdentifier() {
   var windows = ImageWindow.windows;
   if (windows.length == 0) {
      (new MessageBox( "There are no image windows open!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var processedCount = 0;
   var skippedCount = 0;

   // Process all main views in all windows
   for (var w = 0; w < windows.length; w++) {
       var window = windows[w];
       var view = window.mainView;
       
       if (processView(window, view)) {
           processedCount++;
       } else {
           skippedCount++;
       }
   }

   Console.writeln(format("Processed %d view(s), skipped %d view(s)", processedCount, skippedCount));
}

mainFilterIdentifier();

