import { describe,it,expect } from 'vitest';
import { ownedMedia } from './ownedMedia';
const env={VITE_SUPABASE_URL:'https://project.supabase.co',R2_PUBLIC_URL:'https://cdn.example.com'};
describe('owned media boundaries',()=>{
  it('accepts only the authenticated owner prefix',()=>{
    expect(ownedMedia('posts/12/file.jpg',12,env).key).toBe('posts/12/file.jpg');
    expect(ownedMedia('https://project.supabase.co/storage/v1/object/public/media/12/file.jpg',12,env).bucket).toBe('media');
    expect(ownedMedia('https://cdn.example.com/workout-cards/12/file.png',12,env).kind).toBe('r2');
  });
  it.each(['posts/123/file.jpg','posts/12/../13/file.jpg','posts/12//file.jpg','workout-cards/legacy.png','https://evil.example/posts/12/file.jpg','https://project.supabase.co/storage/v1/object/public/media/13/file.jpg','https://cdn.example.com/posts/12/%2E%2E%2F13/file.jpg'])('rejects unsafe or unowned location %s',value=>{
    expect(()=>ownedMedia(value,12,env)).toThrow();
  });
});
