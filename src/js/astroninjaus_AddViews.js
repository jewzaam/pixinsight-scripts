// Simple script to add all images named the same as the applied image where appended by numbers.
// Use to quickly build a composite rejection (II) and weights (DI) images.


function mainAddViews() {
    var window = ImageWindow.activeWindow;
    if ( !window )
    {
       (new MessageBox( "There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
       return;
    }

    var baseId = window.currentView.id;

    var PM = new PixelMath;
    //PM.rescale = true;

    var windows = ImageWindow.windows;
    for (var i in windows) {
       if (windows[i].mainView.id.startsWith(baseId) && 
            windows[i].mainView.id != baseId) {
         PM.expression = format("$T + %s", windows[i].mainView.id);
         PM.executeOn(window.currentView)
       }
    }
}

mainAddViews();

