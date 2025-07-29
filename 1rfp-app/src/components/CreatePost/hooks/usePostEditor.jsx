// src/components/CreatePost/hooks/usePostEditor.jsx
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { supabase } from '../../../supabaseClient';
import MentionList from '../../mentions/MentionList';

export const usePostEditor = (placeholderText, profile, onUpdate) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholderText,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
      // MENTION EXTENSION with following/followers
      Mention.extend({
        name: 'mention',
        addAttributes() {
          return {
            ...this.parent?.(),
            type: {
              default: null,
              parseHTML: e => e.getAttribute('data-type'),
              renderHTML: a => a.type ? { 'data-type': a.type } : {}
            }
          };
        },
        renderHTML({ node, HTMLAttributes }) {
          const { id, label, type } = node.attrs;
          return ['span', { ...HTMLAttributes, class: 'mention', 'data-id': id, 'data-label': label, 'data-type': type }, `@${label}`];
        },
        parseHTML() {
          return [
            {
              tag: 'span[data-type][data-id]',
              getAttrs: element => ({
                id: element.getAttribute('data-id'),
                label: element.getAttribute('data-label'),
                type: element.getAttribute('data-type'),
              }),
            },
            {
              tag: 'span.mention',
              getAttrs: element => ({
                id: element.getAttribute('data-id'),
                label: element.getAttribute('data-label'),
                type: element.getAttribute('data-type'),
              }),
            },
          ];
        },
      }).configure({
        suggestion: {
          items: async ({ query }) => {
            try {
              if (!query || query.length === 0) {
                if (!profile?.id) return [];
                try {
                  const { data: following } = await supabase
                    .from('followers')
                    .select(`
                      following_id,
                      profiles!followers_following_id_fkey(id, full_name, title, organization_name, avatar_url, role)
                    `)
                    .eq('follower_id', profile.id)
                    .limit(5);

                  return (following || []).map(f => ({
                    id: f.profiles.id,
                    name: f.profiles.full_name,
                    type: 'user',
                    avatar_url: f.profiles.avatar_url,
                    title: f.profiles.title,
                    organization_name: f.profiles.organization_name,
                    role: f.profiles.role
                  }));
                } catch (err) {
                  console.error('Error fetching following for mention suggestions:', err);
                  return [];
                }
              }

              if (query.length < 2) return [];

              const searchPattern = `%${query.trim()}%`;
              
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, title, organization_name, avatar_url, role')
                .or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`)
                .limit(5);

              if (profilesError) {
                console.error('Error searching profiles:', profilesError);
              }

              const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('id, name, type, tagline, image_url, slug')
                .ilike('name', searchPattern)
                .limit(5);

              if (orgsError) {
                console.error('Error searching organizations:', orgsError);
              }

              const userResults = (profiles || []).map(profile => ({
                id: profile.id,
                name: profile.full_name,
                type: 'user',
                avatar_url: profile.avatar_url,
                title: profile.title,
                organization_name: profile.organization_name,
                role: profile.role
              }));

              const orgResults = (organizations || []).map(org => {
                const mentionId = `${org.type}-${org.id}`;
                const getOrgTypeLabel = (type) => {
                  const typeLabels = {
                    'nonprofit': 'Nonprofit',
                    'funder': 'Funder', 
                    'foundation': 'Foundation',
                    'education': 'Education',
                    'healthcare': 'Healthcare',
                    'government': 'Government',
                    'religious': 'Religious',
                    'forprofit': 'For-Profit'
                  };
                  return typeLabels[type] || 'Organization';
                };

                return {
                  id: mentionId,
                  name: org.name,
                  type: 'organization',
                  avatar_url: org.image_url,
                  title: org.tagline || `${getOrgTypeLabel(org.type)} Organization`,
                  organization_name: getOrgTypeLabel(org.type),
                  role: org.type,
                  _orgType: org.type,
                  _orgId: org.id,
                  _slug: org.slug
                };
              });

              return [...userResults, ...orgResults];
            } catch (err) {
              console.error('Exception during mention search:', err);
              return [];
            }
          },
          render: () => {
            let component, popup;
            return {
              onStart: props => {
                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                popup = tippy('body', { 
                  getReferenceClientRect: props.clientRect, 
                  appendTo: () => document.body, 
                  content: component.element, 
                  showOnCreate: true, 
                  interactive: true, 
                  trigger: 'manual', 
                  placement: 'bottom-start', 
                  duration: 0,
                  zIndex: 9999,
                  maxWidth: 400,
                  theme: 'light-border'
                });
              },
              onUpdate: props => { 
                component.updateProps(props); 
                popup[0].setProps({ getReferenceClientRect: props.clientRect }); 
              },
              onKeyDown: props => { 
                if (props.event.key === 'Escape') { 
                  popup[0].hide(); 
                  return true; 
                } 
                return component.ref?.onKeyDown(props); 
              },
              onExit: () => { 
                if (popup && popup[0]) popup[0].destroy(); 
                if (component) component.destroy(); 
                popup = null; 
                component = null; 
              },
            };
          },
        },
      }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose-sm outline-none text-slate-700 placeholder:text-slate-400 bg-white',
        style: 'line-height: 1.5; min-height: 120px; white-space: pre-wrap;'
      },
    },
    onUpdate: ({ editor }) => {
      const isEmpty = editor.isEmpty;
      if (onUpdate) onUpdate(isEmpty);
    }
  });

  return editor;
};