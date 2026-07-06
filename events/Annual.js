import wixData from 'wix-data';

$w.onReady(function () {
    $w("#dataset1").onReady(() => {
        $w("#dataset1").setFilter(wixData.filter().hasSome("eventCategory", ["Annual"]))
            .then(() => {
                console.log("Dataset filtered for Annual events");
            })
            .catch((err) => {
                console.error("Error filtering dataset:", err);
            });
    });


});
