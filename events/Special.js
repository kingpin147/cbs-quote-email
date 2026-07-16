import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(function () {
    $w("#dataset1").onReady(() => {
        // Set page size to 6 (5-6 items group) and filter by eventCategory
        $w("#dataset1").setPageSize(6)
            .then(() => {
                return $w("#dataset1").setFilter(wixData.filter().eq("eventCategory", "Special"));
            })
            .then(() => {
                console.log("Dataset filtered for Special events (limit 6)");
            })
            .catch((err) => {
                console.error("Error configuring dataset:", err);
            });

        // Handle clicking on an item to redirect to its dynamic news/details page
        $w("#repeater1").onItemReady(($item, itemData) => {
            $item("#container1").onClick(() => {
                const linkKey = Object.keys(itemData).find(key => key.startsWith('link-'));
                if (linkKey && itemData[linkKey]) {
                    wixLocation.to(itemData[linkKey]);
                } else {
                    console.error("Dynamic page link not found for this event.");
                }
            });
        });
    });
});
