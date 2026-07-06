import wixData from 'wix-data';

$w.onReady(function () {
    $w("#dataset1").onReady(() => {
        $w("#dataset1").setFilter(wixData.filter().hasSome("eventCategory", ["Miscellaneous"]))
            .then(() => {
                console.log("Dataset filtered for Miscellaneous events");
            })
            .catch((err) => {
                console.error("Error filtering dataset:", err);
            });
    });


});
