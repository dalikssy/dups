import { route, requireUser } from "@/lib/adminhub/session";
import { saveVideo, deleteVideo } from "@/lib/adminhub/campaigns";

export const dynamic = "force-dynamic";

// {title, posted_on, length_s, stats: {tiktok: {...}, youtube: {...}}} adds a video; with id it updates one.
export const POST = route(async (request, { params }) => {
  await requireUser();
  await saveVideo(Number(params.id), Number(params.cid), await request.json());
  return Response.json({ ok: true });
});

export const DELETE = route(async (request, { params }) => {
  await requireUser();
  await deleteVideo(Number(params.id), Number(params.cid), Number(new URL(request.url).searchParams.get("id")));
  return Response.json({ ok: true });
});
