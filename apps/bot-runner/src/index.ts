import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';

interface TenantConfig {
  id: string;
  name: string;
  botToken: string;
  isActive: boolean;
  settings?: {
    welcomeText?: string | null;
    welcomeType?: string;
    welcomeMediaUrl?: string | null;
  };
}

async function fetchTenants(): Promise<TenantConfig[]> {
  try {
    const { data } = await axios.get('http://localhost:4000/tenants', {
      headers: { Authorization: `Bearer ${process.env.BOT_RUNNER_TOKEN || ''}` }
    });
    return data.tenants ?? [];
  } catch (err) {
    console.error('Failed to fetch tenants', err);
    return [];
  }
}

function bootstrapTenant(tenant: TenantConfig) {
  const bot = new Telegraf(tenant.botToken);
  bot.start(async (ctx) => {
    const welcomeText = tenant.settings?.welcomeText || `Selamat datang di ${tenant.name}`;
    await ctx.reply(welcomeText, {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('List Product', 'LIST_PRODUCT')],
        [Markup.button.callback('Saldo', 'BALANCE')],
        [Markup.button.callback('Riwayat', 'HISTORY')]
      ])
    });
  });

  bot.action('LIST_PRODUCT', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Fitur list product belum siap di runner stub.');
  });

  bot.launch();
  console.log(`Bot for tenant ${tenant.name} launched`);
}

async function main() {
  const tenants = await fetchTenants();
  tenants.filter((t) => t.isActive).forEach(bootstrapTenant);
}

main();
