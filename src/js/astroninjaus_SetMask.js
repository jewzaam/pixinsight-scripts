function mainSetMask() {
    // auto stretches the current active view using ez scripts
    var window = ImageWindow.activeWindow;
    if ( !window ) {
        (new MessageBox("There is no active image window!",
                        TITLE, StdIcon_Error, StdButton_Ok )).execute();
        return;
    }

    var mask_id         = Parameters.getString("mask_id");
    var mask_enabled    = Parameters.has("mask_enabled") ? Parameters.getBoolean("mask_enabled") : true;
    var mask_visible    = Parameters.has("mask_visible") ? Parameters.getBoolean("mask_visible") : true;
    var mask_inverted   = Parameters.has("mask_inverted") ? Parameters.getBoolean("mask_inverted") : false;

    window.mask = View.viewById(mask_id).window
    window.maskEnabled = mask_enabled;
    window.maskVisible = mask_visible;
    window.maskInverted = mask_inverted;

}

mainSetMask();

