import wixLocation from 'wix-location';

$w.onReady(function () {
    $w('#annual').onClick(() => {
        wixLocation.to("/annual");
    });
    
    $w('#special').onClick(() => {
        wixLocation.to("/specialevents");
    });
    
    $w('#misc').onClick(() => {
        wixLocation.to("/misc");
    });
});
