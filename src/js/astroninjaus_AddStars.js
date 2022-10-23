#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#feature-id  astroninja.us > Add Stars

#define ID                 "AddStars"
#define TITLE              "Add Stars"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info adds image "$T_stars" into active view

#include "astroninjaus_Common.js"

function mainAddStars() {
    // auto stretches the current active view using ez scripts
    var window = ImageWindow.activeWindow;
    if ( !window ) {
        (new MessageBox("There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

    // find existing images first.  these are required.
    var starsViewIdSearch = format("%s_stars", window.currentView.id)
    var unscreenedViewIdSearch = format("%s_unscreened", window.currentView.id)

    var stars = findWindowById(starsViewIdSearch)
    var unscreened = findWindowById(unscreenedViewIdSearch)

    if (stars == null && unscreened == null) {
        Console.warningln(format("Cannot find '%s' or '%s'.  At least one is required."), starsViewIdSearch, unscreenedViewIdSearch)
    } else {

        Console.show();
        Console.writeln("Adding stars back into image.")

        if (stars != null) {
            var with_stars = cloneView(window.mainView, format("%s_with_stars", window.mainView.id))
            with_stars.show()
            var PM = new PixelMath;
            PM.expression = format("%s + %s", window.currentView.id, stars.mainView.id)
            PM.executeOn(with_stars.currentView)
        }

        if (unscreened != null) {
            var with_unscreened = cloneView(window.mainView, format("%s_with_unscreened", window.mainView.id))
            with_unscreened.show()
            var PM = new PixelMath;
            PM.expression = format("~((~%s)*(~%s))", window.currentView.id, unscreened.mainView.id)
            PM.executeOn(with_unscreened.currentView)
        }

        Console.hide();
    }
}

mainAddStars();
