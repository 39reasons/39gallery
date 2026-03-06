#!/usr/bin/env node
// Backfill script: fetches tweet data from FxTwitter API and builds weverse cache

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

const TWEET_IDS = [
  "2023083596920107350","2023081817650119104","2023081480612909160","2023024299582582852","2023020235557642696",
  "2029525557793194361","2029508267697697130","2028961554322841952","2028842851216322869","2028842700288520487",
  "2024863492012995040","2024859430878126581","2024849651774435723","2024840403900359126","2024763000570163287",
  "2024113730770894859","2023991643716628886","2023763938215948745","2023594179121553899","2023572317058613467",
  "2022806639007416721","2022685205077590320","2022672655225102366","2022645042427375997","2022321440670794185",
  "2021903393338667216","2021800614087270430","2021509535324934338","2021509068393939268","2021508782107562188",
  "2021218473687269441","2020879197829251390","2020446291596066837","2020137540917805261","2020069996081156401",
  "2019801974049264071","2019799311760928828","2019794389120225772","2019792005828579821","2019787703533854779",
  "2019412252202266979","2018650740814942551","2018650480272978227","2018283828389810535","2018163278950674909",
  "2017976100006015128","2017973998492016933","2017934684018164004","2017622652546900444","2017622146994843722",
  "2016889243683975609","2016167800650256526","2016138225371250929","2016050351472832867","2016044618018636060",
  "2015793393960456581","2015736151861018848","2015715022467444840","2015714942964449576","2015714550851493911",
  "2014689498659951094","2014687870968098842","2014459628457754742","2014459426090996093","2014259263896531011",
  "2013923455188561981","2013904317451821219","2013602636210065616","2013595117144154539","2013578977328120172",
  "1905941233416966471","1905800685204983874","1905240697050927540","1905203917866119515","1904896454512046215",
  "1939660283703701753","1939473300930851144","1938844461468954817","1938844286612861166","1938624502885142592",
  "1972938007310369176","1972671724077392204","1972670792992248273","1972640441410474167","1972305236904796326",
  "2006366566443634958","2006021919351410991","2005685836231369134","2005673887552753841","2005267481947201608",
];

const MEMBER_PATTERNS = {
  chaewon: /chaewon|채원|kimchaewon/i,
  sakura: /sakura|사쿠라|kkura/i,
  yunjin: /yunjin|윤진|huhyunjin/i,
  kazuha: /kazuha|카즈하/i,
  eunchae: /eunchae|은채|hongeunchae/i,
};

const MEMBER_NAMES = {
  chaewon: "Chaewon",
  sakura: "Sakura",
  yunjin: "Yunjin",
  kazuha: "Kazuha",
  eunchae: "Eunchae",
};

function detectMember(text) {
  for (const [key, pattern] of Object.entries(MEMBER_PATTERNS)) {
    if (pattern.test(text)) {
      return { key, name: MEMBER_NAMES[key] };
    }
  }
  return null;
}

function proxyUrl(url) {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

async function fetchTweet(id) {
  const res = await fetch(`https://api.fxtwitter.com/sserapics/status/${id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tweet;
}

async function main() {
  const cacheDir = join(process.cwd(), ".cache", "weverse");
  mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, "posts.json");

  // Load existing cache
  let existing = [];
  try {
    existing = JSON.parse(readFileSync(cacheFile, "utf-8"));
  } catch {}
  const existingIds = new Set(existing.map((p) => p.id));

  const newIds = TWEET_IDS.filter((id) => !existingIds.has(id));
  console.log(`${existing.length} cached, ${newIds.length} new to fetch`);

  const posts = [...existing];
  let fetched = 0;
  let failed = 0;

  for (const id of newIds) {
    try {
      const tweet = await fetchTweet(id);
      if (!tweet) {
        console.log(`  SKIP ${id} - no data`);
        failed++;
        continue;
      }

      const text = tweet.text || "";
      const member = detectMember(text);
      if (!member) {
        console.log(`  SKIP ${id} - no member match: ${text.substring(0, 60)}`);
        failed++;
        continue;
      }

      const photos = tweet.media?.photos || [];
      const imageUrls = photos.map((p) => proxyUrl(p.url));
      if (imageUrls.length === 0) {
        console.log(`  SKIP ${id} - no images`);
        failed++;
        continue;
      }

      const post = {
        id: tweet.id,
        imageUrls,
        memberKey: member.key,
        memberName: member.name,
        tweetUrl: tweet.url,
        tweetText: text,
        timestamp: Math.floor(new Date(tweet.created_at).getTime() / 1000),
      };

      posts.push(post);
      fetched++;
      console.log(`  OK ${id} - ${member.name} (${imageUrls.length} imgs)`);

      // Small delay to be nice to FxTwitter
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`  ERR ${id}: ${err.message}`);
      failed++;
    }
  }

  // Sort by timestamp descending
  posts.sort((a, b) => b.timestamp - a.timestamp);

  writeFileSync(cacheFile, JSON.stringify(posts, null, 2));
  console.log(`\nDone: ${posts.length} total cached (${fetched} new, ${failed} failed)`);
}

main().catch(console.error);
