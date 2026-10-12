export const communityReviewMigration = `
-- Default deny publication until a moderator reviews the exact revision.
CREATE TABLE IF NOT EXISTS community_suspensions (
 "userId" integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 reason text NOT NULL, "moderatorId" integer REFERENCES users(id) ON DELETE SET NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_reviews (
 kind text NOT NULL CHECK (kind IN ('profile','post','comment')),
 "targetId" integer NOT NULL, "userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 revision integer NOT NULL DEFAULT 1,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 "updatedAt" timestamptz NOT NULL DEFAULT now(),
 "moderatorId" integer REFERENCES users(id) ON DELETE SET NULL,
 PRIMARY KEY (kind,"targetId")
);
CREATE INDEX IF NOT EXISTS community_reviews_queue ON community_reviews(status,"updatedAt");
CREATE OR REPLACE FUNCTION flextab_queue_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item_kind text := TG_ARGV[0]; item_id integer; owner_id integer;
BEGIN
 IF TG_OP='DELETE' THEN
  DELETE FROM community_reviews WHERE kind=item_kind AND "targetId"=OLD.id;
  RETURN OLD;
 END IF;
 IF item_kind='profile' THEN
  IF TG_OP='UPDATE' AND (NEW.name,NEW.bio,NEW."avatarUrl") IS NOT DISTINCT FROM (OLD.name,OLD.bio,OLD."avatarUrl") THEN RETURN NEW; END IF;
  owner_id:=NEW.id; item_id:=NEW.id;
 ELSE
  owner_id:=NEW."userId"; item_id:=NEW.id;
 END IF;
 IF EXISTS (SELECT 1 FROM community_suspensions WHERE "userId"=owner_id) THEN
  RAISE EXCEPTION 'Community access suspended. Personal workouts and account deletion remain available.' USING ERRCODE='42501';
 END IF;
 INSERT INTO community_reviews (kind,"targetId","userId") VALUES (item_kind,item_id,owner_id)
 ON CONFLICT (kind,"targetId") DO UPDATE SET status='pending',revision=community_reviews.revision+1,"updatedAt"=now(),"moderatorId"=NULL;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS community_profile_review ON users;
CREATE TRIGGER community_profile_review AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION flextab_queue_review('profile');
DROP TRIGGER IF EXISTS community_post_review ON posts;
CREATE TRIGGER community_post_review AFTER INSERT OR UPDATE OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION flextab_queue_review('post');
DROP TRIGGER IF EXISTS community_comment_review ON post_comments;
CREATE TRIGGER community_comment_review AFTER INSERT OR UPDATE OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION flextab_queue_review('comment');
CREATE OR REPLACE FUNCTION flextab_media_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE community_reviews SET status='pending',revision=revision+1,"updatedAt"=now(),"moderatorId"=NULL
 WHERE kind='post' AND "targetId"=COALESCE(NEW."postId",OLD."postId");
 RETURN COALESCE(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS community_media_review ON post_media;
CREATE TRIGGER community_media_review AFTER INSERT OR UPDATE OR DELETE ON post_media FOR EACH ROW EXECUTE FUNCTION flextab_media_review();
-- Existing content also needs review. Re-running does not reset decisions.
INSERT INTO community_reviews (kind,"targetId","userId") SELECT 'profile',id,id FROM users ON CONFLICT DO NOTHING;
INSERT INTO community_reviews (kind,"targetId","userId") SELECT 'post',id,"userId" FROM posts ON CONFLICT DO NOTHING;
INSERT INTO community_reviews (kind,"targetId","userId") SELECT 'comment',id,"userId" FROM post_comments ON CONFLICT DO NOTHING;

-- Shared workout cards are rendered from live set logs; editing them invalidates review.
CREATE OR REPLACE FUNCTION flextab_workout_review() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_session integer; new_session integer;
BEGIN
 IF TG_TABLE_NAME='set_logs' THEN
  IF TG_OP<>'INSERT' THEN old_session:=OLD."sessionId"; END IF;
  IF TG_OP<>'DELETE' THEN new_session:=NEW."sessionId"; END IF;
 ELSE
  IF TG_OP<>'INSERT' THEN old_session:=OLD.id; END IF;
  IF TG_OP<>'DELETE' THEN new_session:=NEW.id; END IF;
 END IF;
 UPDATE community_reviews SET status='pending',revision=revision+1,"updatedAt"=now(),"moderatorId"=NULL
 WHERE kind='post' AND "targetId" IN (SELECT id FROM posts WHERE "workoutSessionId" IN (old_session,new_session));
 RETURN COALESCE(NEW,OLD);
END $$;
DROP TRIGGER IF EXISTS community_workout_review ON set_logs;
CREATE TRIGGER community_workout_review AFTER INSERT OR UPDATE OR DELETE ON set_logs FOR EACH ROW EXECUTE FUNCTION flextab_workout_review();
DROP TRIGGER IF EXISTS community_session_review ON workout_sessions;
CREATE TRIGGER community_session_review AFTER UPDATE OR DELETE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION flextab_workout_review();
`;
