import { Redis } from "ioredis";
import int from "@3-/int";
import Send from "@8v/send";

const check = async (env) => {
  const redis = new Redis(env.R),
    p = redis.pipeline(),
    now = int(new Date() / 6e4);

  p.get("status:ts");
  p.setex("status-watch:ts", 864e3, now);
  const ts = (await p.exec())[0][1];
  redis.disconnect();

  let err;

  if (ts) {
    const diff = now - ts;
    console.log(ts, diff);
    if (diff > 5) {
      err = "监控失联 " + diff + " 分钟";
    }
  } else {
    err = "监控没有运行";
  }

  if (err) {
    throw err;
  }
};

export default {
  async fetch(req) {
    console.log(req.url);
    const url = new URL(req.url);
    url.pathname = "/__scheduled";
    url.searchParams.append("cron", "* * * * *");
    return new Response("");
  },

  async scheduled(_event, env, _ctx) {
    try {
      await check(env);
    } catch (err) {
      console.error(err);
      return Send(JSON.parse(env.SEND))("status-watch 告警", err.toString());
    }
  },
};
