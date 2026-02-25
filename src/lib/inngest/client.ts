import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "geosight",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
