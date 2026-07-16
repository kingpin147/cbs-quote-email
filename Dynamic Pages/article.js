import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {
    
    // Make sure your database collection name is "article"
    wixData.query("ArticlesByDrChandraBhanuSatpathy")
        .limit(250)
        .find()
        .then((results) => {
            let items = results.items;
            let allLanguages = items.map(item => item.language).filter(Boolean);
            let uniqueLanguages = [...new Set(allLanguages)];
            let options = uniqueLanguages.map(lang => {
                return { "label": lang, "value": lang };
            });
            options.unshift({ "label": "All Languages", "value": "all" });
            $w("#languageDropdown").options = options;
        })
        .catch((err) => {
            console.error("Error loading languages:", err);
        });

    $w("#dataset1").onReady(() => {
        
        $w("#dataset1").setSort(wixData.sort().descending("date"));
        $w("#sortOrder").value = "latest";

        $w("#sortOrder").onChange((event) => {
            let sortValue = $w("#sortOrder").value;
            
            if (sortValue === "latest") {
                $w("#dataset1").setSort(wixData.sort().descending("date"));
            } else if (sortValue === "oldest") {
                $w("#dataset1").setSort(wixData.sort().ascending("date"));
            }
        });

        $w("#languageDropdown").onChange((event) => {
            let selectedLanguage = $w("#languageDropdown").value;
            
            if (selectedLanguage === "all" || !selectedLanguage) {
                $w("#dataset1").setFilter(wixData.filter());
            } else {
                $w("#dataset1").setFilter(wixData.filter().eq("language", selectedLanguage));
            }
        });

        $w("#repeater1").onItemReady(($item, itemData, index) => {
            if (itemData.content) {
                let contentText = itemData.content.trim();
                let lines = contentText.split('\n');
                let display = contentText;
                let wasCut = false;

                if (lines.length > 2) {
                    display = lines.slice(0, 2).join('\n').trim();
                    wasCut = true;
                }

                const maxChars = 200;
                if (display.length > maxChars) {
                    let truncated = display.slice(0, maxChars);
                    let lastSpace = truncated.lastIndexOf(' ');
                    if (lastSpace > maxChars - 30) {
                        truncated = truncated.slice(0, lastSpace);
                    }
                    $item("#descriptionText").text = truncated.trim() + " ...";
                } else if (wasCut) {
                    $item("#descriptionText").text = display + " ...";
                } else {
                    $item("#descriptionText").text = display;
                }
            }

            $item("#container1").onClick((event) => {
                // Use the exact Field ID from Wix CMS: link-articles-edit-title
                let targetUrl = itemData['link-articles-edit-title']; 
                if (targetUrl) {
                    wixLocation.to(targetUrl);
                } else {
                    console.error("Dynamic page link not found for this item.");
                }
            });
        });
        
    });
});
