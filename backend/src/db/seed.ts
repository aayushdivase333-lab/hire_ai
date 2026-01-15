import { db, initializeDatabase } from './database.js';
import { nanoid } from 'nanoid';

console.log('🌱 Seeding database with sample templates...');

initializeDatabase();

// Default email templates
const templates = [
    {
        id: nanoid(),
        name: 'Website Support - First Touch',
        subject: 'Quick question about {{company_name}}\'s web presence',
        body: `Hi {{first_name}},

I came across {{company_name}} while researching boutique investment firms in your area, and I noticed your team focuses on {{role}}-level work.

I specialize in helping small investment teams and family offices with their websites and digital tools—everything from modernizing outdated sites to building internal dashboards that actually get used.

{{my_service_summary}}

Would a 15-minute call be worth your time to explore if there's a fit? If not, no worries at all.

Best,
{{my_name}}

{{opt_out_text}}`,
        template_type: 'first_touch',
        offer_type: 'website_support',
        sequence_position: 1,
        is_active: 1
    },
    {
        id: nanoid(),
        name: 'Website Support - Follow Up 1',
        subject: 'Re: {{company_name}} web presence',
        body: `Hi {{first_name}},

I wanted to follow up on my note from last week. I know things get busy.

If your team has any upcoming projects around your website, investor portal, or internal tools, I'd love to chat.

Most of my clients are firms like yours—small teams that need reliable tech support without the overhead of a full IT department.

Worth a quick call?

{{my_name}}

{{opt_out_text}}`,
        template_type: 'follow_up_1',
        offer_type: 'website_support',
        sequence_position: 2,
        is_active: 1
    },
    {
        id: nanoid(),
        name: 'Automation & Dashboards - First Touch',
        subject: 'Automation idea for {{company_name}}',
        body: `Hi {{first_name}},

I noticed {{company_name}} works in the investment/family office space, and I wanted to reach out directly.

I help operations and deal teams at boutique firms automate their repetitive workflows—things like data aggregation, reporting dashboards, and CRM integrations that actually save time.

One recent project: I helped a family office automate their quarterly reporting, cutting a 2-day process down to 20 minutes.

If that sounds interesting, I'd love to learn more about what your team is working on. Would a 15-minute call make sense?

Best,
{{my_name}}

{{opt_out_text}}`,
        template_type: 'first_touch',
        offer_type: 'automation_dashboards',
        sequence_position: 1,
        is_active: 1
    },
    {
        id: nanoid(),
        name: 'Automation & Dashboards - Follow Up 1',
        subject: 'Re: Automation for {{company_name}}',
        body: `Hi {{first_name}},

Just bumping this up—I know operations work never stops.

Happy to share a few examples of automations I've built for similar firms if it helps. No commitment, just context.

Let me know if a brief call would be useful.

{{my_name}}

{{opt_out_text}}`,
        template_type: 'follow_up_1',
        offer_type: 'automation_dashboards',
        sequence_position: 2,
        is_active: 1
    },
    {
        id: nanoid(),
        name: 'General Follow Up 2',
        subject: 'Last note from me',
        body: `Hi {{first_name}},

I'll keep this brief—this is my last follow-up.

If you ever need help with websites, dashboards, or automations for {{company_name}}, feel free to reach out. I'm always happy to chat.

Wishing you and the team a great rest of the quarter.

{{my_name}}

{{opt_out_text}}`,
        template_type: 'follow_up_2',
        offer_type: 'website_support',
        sequence_position: 3,
        is_active: 1
    }
];

const insertTemplate = db.prepare(`
  INSERT OR REPLACE INTO email_templates 
  (id, name, subject, body, template_type, offer_type, sequence_position, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const template of templates) {
    insertTemplate.run(
        template.id,
        template.name,
        template.subject,
        template.body,
        template.template_type,
        template.offer_type,
        template.sequence_position,
        template.is_active
    );
}

console.log(`✅ Seeded ${templates.length} email templates`);
console.log('🎉 Seeding complete!');
