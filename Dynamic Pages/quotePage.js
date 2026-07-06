import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    $w("#quoteRepeater").hide();
    try {
        const results = await wixData.query("DailyQuote")
            .descending("quoteDate")
            .limit(100)
            .find();

        console.log("Raw items fetched from CMS:", results.items);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const visibleItems = results.items.filter(item => {
            if (!item.quoteDate) return false;
            const itemDate = new Date(item.quoteDate);
            const isVisible = itemDate <= endOfToday;
            console.log(`Comparing item quoteDate: ${item.quoteDate} (Parsed: ${itemDate.toISOString()}) <= Today: ${endOfToday.toISOString()} -> Result: ${isVisible}`);
            return isVisible;
        });

        $w("#quoteRepeater").onItemReady(($item, itemData) => {
            if ($item("#quoteText")) {
                $item("#quoteText").text = itemData.quoteText ? `"${itemData.quoteText}"` : "";
            }
            if ($item("#quoteDateText") && itemData.quoteDate) {
                $item("#quoteDateText").text = new Date(itemData.quoteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }
            
            $item("#quoteBox").onClick(() => {
                if (itemData["link-daily-quote-quoteText"]) {
                    wixLocation.to(itemData["link-daily-quote-quoteText"]);
                }
            });
        });
        let currentItems = [...visibleItems];

        $w("#sortingDropdown").onChange((event) => {
            const sortValue = event.target.value;
            // Handle both "Oldest" label and underlying value regardless of casing
            if (sortValue.toLowerCase().includes('old')) {
                currentItems.sort((a, b) => new Date(a.quoteDate).getTime() - new Date(b.quoteDate).getTime());
            } else {
                currentItems.sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime());
            }
            $w("#quoteRepeater").data = currentItems;
        });

        $w("#quoteRepeater").data = currentItems;
        $w("#quoteRepeater").show();
    } catch (err) {
        console.error(err);
    }
});
