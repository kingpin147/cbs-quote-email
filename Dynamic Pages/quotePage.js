import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    $w("#quoteRepeater").hide();
    try {
        const results = await wixData.query("DailyQuote")
            .descending("quoteDate")
            .limit(250)
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

        // Set up the language dropdown options
        let allLanguages = visibleItems.map(item => item.language).filter(Boolean);
        let uniqueLanguages = [...new Set(allLanguages)];
        let options = uniqueLanguages.map(lang => {
            return { "label": lang, "value": lang };
        });
        options.unshift({ "label": "All Languages", "value": "all" });
        $w("#languageDropdown").options = options;

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

        // Combined function to filter and sort repeater items
        const updateRepeater = () => {
            const selectedLanguage = $w("#languageDropdown").value;
            const sortValue = $w("#sortingDropdown").value || "newest";

            let itemsToDisplay = [...visibleItems];

            // 1. Filter by language
            if (selectedLanguage && selectedLanguage !== "all") {
                itemsToDisplay = visibleItems.filter(item => item.language === selectedLanguage);
            }

            // 2. Sort by date
            if (sortValue.toLowerCase().includes('old')) {
                itemsToDisplay.sort((a, b) => new Date(a.quoteDate).getTime() - new Date(b.quoteDate).getTime());
            } else {
                itemsToDisplay.sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime());
            }

            currentItems = itemsToDisplay;
            $w("#quoteRepeater").data = currentItems;
        };

        // Wire up event listeners
        $w("#languageDropdown").onChange(updateRepeater);
        $w("#sortingDropdown").onChange(updateRepeater);

        // Perform initial load
        updateRepeater();
        $w("#quoteRepeater").show();
    } catch (err) {
        console.error(err);
    }
});
