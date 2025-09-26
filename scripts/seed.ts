#!/usr/bin/env ts-node

import { seed } from '../src/database/seed';

console.log('🌱 シードデータの作成を開始します...');
seed().then(() => {
  console.log('✅ シードデータの作成が完了しました');
  process.exit(0);
}).catch((error) => {
  console.error('❌ シードデータの作成中にエラーが発生しました:', error);
  process.exit(1);
});
