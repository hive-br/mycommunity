

import { DefaultRenderer } from "@hiveio/content-renderer";

function transformIPFSContent(content: string): string {
    const regex = /<iframe src="https:\/\/ipfs\.skatehive\.app\/ipfs\/([a-zA-Z0-9-?=&]+)"(?:(?!<\/iframe>).)*\sallowfullscreen><\/iframe>/g;
  
    return content.replace(regex, (match, videoID) => {
      return `<video controls muted preload="none" loading="lazy"> 
                  <source src="https://ipfs.skatehive.app/ipfs/${videoID}" type="video/mp4">
              </video>`;
    });
}

function preventIPFSDownloads(content: string): string {
    // Find links to IPFS content and add target="_blank" and safety attributes
    // This prevents the browser from trying to navigate to/download IPFS files
    return content.replace(
        /<a href="(https?:\/\/[^"]*(?:ipfs|bafy|Qm)[^"]*)"([^>]*)>/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer"$2 onclick="event.preventDefault(); window.open(this.href, \'_blank\'); return false;">'
    );
}

function convertHiveUrlsToInternal(content: string): string {
    // List of known Hive frontends
    const hiveFrontends = [
        'peakd.com',
        'ecency.com',
        'hive.blog',
        'hiveblog.io',
        'leofinance.io',
        '3speak.tv',
        'd.tube',
        'esteem.app',
        'busy.org'
    ];
    
    // Create regex pattern for all frontends
    const frontendsPattern = hiveFrontends.map(domain => domain.replace('.', '\\.')).join('|');
    
    // Match Hive post URLs: https://frontend.com/category/@author/permlink or https://frontend.com/@author/permlink
    const hiveUrlRegex = new RegExp(
        `<a href="https?:\\/\\/(${frontendsPattern})\\/((?:[^/]+\\/)?@([a-z0-9.-]+)\\/([a-z0-9-]+))"([^>]*)>`,
        'gi'
    );
    
    return content.replace(hiveUrlRegex, (match, frontend, fullPath, author, permlink, attributes) => {
        // Convert to internal link format: /@author/permlink
        const internalUrl = `/@${author}/${permlink}`;
        return `<a href="${internalUrl}"${attributes}>`;
    });
}

export default function markdownRenderer(markdown: string) {

    const renderer = new DefaultRenderer({
        baseUrl: "https://hive.blog/",
        breaks: true,
        skipSanitization: true, // Allow HTML tags like <u>, <ins> for formatting
        allowInsecureScriptTags: false,
        addNofollowToLinks: true,
        doNotShowImages: false,
        assetsWidth: 540,
        assetsHeight: 380,
        imageProxyFn: (url: string) => {
            // Add error handling and caching for images
            try {
                // Use a more reliable image proxy or fallback
                if (url.includes('ipfs')) {
                    return `https://ipfs.io/ipfs/${url.split('/ipfs/')[1]}`;
                }
                return url;
            } catch (error) {
                console.warn('Image proxy error:', error);
                return url;
            }
        },
        usertagUrlFn: (account: string) => "/@" + account,
        hashtagUrlFn: (hashtag: string) => "/trending/" + hashtag,
        isLinkSafeFn: (url: string) => true,
        addExternalCssClassToMatchingLinksFn: (url: string) => true,
        ipfsPrefix: "https://ipfs.skatehive.app" // IPFS gateway to display ipfs images
    });

    let safeHtmlStr = renderer.render(markdown);
    
    // Transform IPFS iframes to video tags
    safeHtmlStr = transformIPFSContent(safeHtmlStr);
    
    // Prevent direct IPFS links from triggering downloads
    safeHtmlStr = preventIPFSDownloads(safeHtmlStr);
    
    // Convert Hive frontend URLs to internal links
    safeHtmlStr = convertHiveUrlsToInternal(safeHtmlStr);

    return  safeHtmlStr
}