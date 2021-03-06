#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#feature-id  astroninja.us > Remove Stars

#define ID                 "RemoveStars"
#define TITLE              "Remove Stars"
#define VERSION            "0.0.1"
#define AUTHOR             "Naveen Malik"

#feature-info use StarXTerminator and StarNet2 to remove stars, creates view <id>_stars

#include "astroninjaus_Common.js"

function do_RemoveStars(sourceView, starsView, tool_name) {
    if (tool_name == "StarNet v1") {
        do_StarNetv1(sourceView, starsView);
    } else if (tool_name == "StarNet v2") {
        do_StarNetv2(sourceView, starsView);
    } else if (tool_name == "StarXTerminator") {
        do_StarXTerminator(sourceView, starsView);
    }
}

function do_StarNetv1(sourceView, starsView) {
    var starsStarNet1 = doExtractStars_StarNet1(sourceView)
	var PM = new PixelMath;
	PM.expression = format("$T - %s", starsStarNet1.mainView.id)
	PM.executeOn(sourceView)
    PM.expression = format("$T + %s", starsStarNet1.mainView.id)
    PM.executeOn(starsView)
    starsStarNet1.forceClose()
}

function do_StarNetv2(sourceView, starsView) {
    var starsStarNet2 = doExtractStars_StarNet2(sourceView)
	var PM = new PixelMath;
	PM.expression = format("$T - %s", starsStarNet2.mainView.id)
	PM.executeOn(sourceView)
    PM.expression = format("$T + %s", starsStarNet2.mainView.id)
    PM.executeOn(starsView)
    starsStarNet2.forceClose()
}

function do_StarXTerminator(sourceView, starsView) {
    var starsStarXTerminator = doExtractStars_StarXTerminator(sourceView)
	var PM = new PixelMath;
	PM.expression = format("$T - %s", starsStarXTerminator.mainView.id)
	PM.executeOn(sourceView)
    PM.expression = format("$T + %s", starsStarXTerminator.mainView.id)
    PM.executeOn(starsView)
    return starsStarXTerminator.forceClose()
}

function mainRemoveStars() {
    var window = ImageWindow.activeWindow;
    if ( !window ) {
        (new MessageBox("There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

    var remove_mask = false;

    if (window.maskEnabled && !window.mask.isNull)  {
        var q = new MessageBox("Window has an active mask.  Temporarily remove the mask?",
            "Warning", StdIcon_Question,
            StdButton_No, StdButton_Yes);
        if (q.execute() == StdButton_Yes) {
            remove_mask = true
        }
    }

	Console.show();
	Console.writeln("Removing stars from image...")
 
    var old_mask = window.maskEnabled;

    // remove mask if needed
    if (remove_mask) {
        window.maskEnabled = false
    }

    // get order to use star removal tools: StarNet v1, StarNet v2, StarXTerminator
	var position_0 = Parameters.has("position_0") ? Parameters.getString("position_0") : "none";
	var position_1 = Parameters.has("position_1") ? Parameters.getString("position_1") : "none";
    var position_2 = Parameters.has("position_2") ? Parameters.getString("position_2") : "none";

    // initialize the stars image
    var stars = cloneView(window.currentView, format("%s_stars", window.currentView.id))
    stars.show()
    starsView = stars.mainView
	var PM = new PixelMath;
	PM.expression = "0"
	PM.executeOn(starsView)

    do_RemoveStars(window.currentView, starsView, position_0)
    do_RemoveStars(window.currentView, starsView, position_1)
    do_RemoveStars(window.currentView, starsView, position_2)
    
    // enable mask if one was removed
    if (remove_mask) {
        window.maskEnabled = old_mask
    }

	Console.hide();
}

mainRemoveStars();

