// Simple script to read filter from fits header and rename view with the filter name.

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

function mainFilterIdentifier() {
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

    var oldId = window.currentView.id;

    // get filter name
    var filter = getKeyValue(window, 'FILTER');

    // it will have single quotes around it, strip those
    filter = filter.substring(1, filter.length - 1);

    if (!filter) {
        (new MessageBox( "There is no 'FILTER' keyword on the image!",
                         TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

    window.currentView.id = filter;

    Console.writeln(format("Renamed '%s' to '%s'!", oldId, filter))
}

mainFilterIdentifier();

