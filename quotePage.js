import wixData from 'wix-data';

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
            if ($item("#authorText")) {
                $item("#authorText").text = itemData.author ? `- ${itemData.author}` : "";
            }
            if ($item("#quoteImage")) {
                if (itemData.quoteImage) {
                    $item("#quoteImage").src = itemData.quoteImage;
                    $item("#quoteImage").expand();
                } else {
                    $item("#quoteImage").collapse();
                }
            }
            if ($item("#quoteDateText") && itemData.quoteDate) {
                $item("#quoteDateText").text = new Date(itemData.quoteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        });
        $w("#quoteRepeater").data = visibleItems;
        $w("#quoteRepeater").show();
    } catch (err) {
        console.error(err);
    }
});
