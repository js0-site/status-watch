import Redis from "@3-/ioredis";
import int from "@3-/int";
import Send from "@8v/send";

let ERR_ING;

const check = async (env) => {
  const redis = Redis(env.R),
    p = redis.pipeline(),
    now = int(new Date() / 6e4);

  p.get("status:ts");
  p.setex("status-watch:ts", 864e3, now);
  const ts = (await p.exec())[0][1];
  redis.disconnect();

  let err;

  if (ts) {
    const diff = now - ts;
    if (diff > 5) {
      err = "监控失联 " + diff + " 分钟";
    } else {
      console.log(ts, diff);
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
    const send = (title, txt = "") => {
      if (txt) {
        txt += "\n\n";
      }
      return Send(JSON.parse(env.SEND))(
        title,
        txt + "消息发送自 cloudflare 定时任务 status-watch",
      );
    };
    try {
      await check(env);
      if (ERR_ING) {
        ERR_ING = 0;
        await send("✅ 监控服务恢复正常");
      }
    } catch (err) {
      ERR_ING = 1;
      console.error(err);
      await send("❌ 监控告警", err.toString());
    }
  },
};
