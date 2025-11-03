import { Client } from '@hiveio/dhive';

const client = new Client(['https://api.hive.blog', 'https://api.deathwing.me']);

async function analyzePost(author, permlink) {
  try {
    const post = await client.database.call('get_content', [author, permlink]);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`POST: @${author}/${permlink}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Title: ${post.title}`);
    console.log(`Body length: ${post.body.length} characters\n`);
    
    // Count different types of media
    const iframes = post.body.match(/<iframe[^>]*>/g) || [];
    const images = post.body.match(/!\[.*?\]\([^)]+\)/g) || [];
    const ipfsGateway = post.body.match(/https?:\/\/[^\/]*ipfs[^\/]*\/[^\s\)"]*/g) || [];
    const videos = post.body.match(/\.(mp4|webm|mov|avi)/gi) || [];
    
    console.log(`📊 Media Analysis:`);
    console.log(`   Iframes: ${iframes.length}`);
    console.log(`   Markdown Images: ${images.length}`);
    console.log(`   IPFS URLs: ${ipfsGateway.length}`);
    console.log(`   Video files: ${videos.length}\n`);
    
    // Show iframes
    if (iframes.length > 0) {
      console.log(`📹 Iframes found:`);
      iframes.forEach((iframe, i) => {
        const src = iframe.match(/src=["']([^"']+)["']/);
        if (src) {
          console.log(`   ${i + 1}. ${src[1].substring(0, 100)}...`);
        }
      });
      console.log();
    }
    
    // Show IPFS URLs
    if (ipfsGateway.length > 0) {
      console.log(`🔗 IPFS URLs found:`);
      const uniqueUrls = [...new Set(ipfsGateway)];
      uniqueUrls.forEach((url, i) => {
        console.log(`   ${i + 1}. ${url.substring(0, 80)}...`);
      });
      console.log();
    }
    
    // Show first 500 chars of body
    console.log(`📝 Body preview (first 500 chars):`);
    console.log(post.body.substring(0, 500));
    console.log('...\n');
    
  } catch (error) {
    console.error(`❌ Error fetching post: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Analyzing posts that cause network spikes...\n');
  
  await analyzePost('garciarodrigues', '20251101t001357625z');
  await analyzePost('blessskateshop', '20251031t180434965z');
  
  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);
