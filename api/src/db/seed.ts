import { db, schema } from "./client.js";

// Cria o perfil de busca inicial (a sidebar edita este perfil). Seguro de rodar mais de uma vez.
const existing = await db.query.searchProfiles.findFirst();

if (existing) {
  console.log(`Já existe o perfil #${existing.id} ("${existing.name}"); nada a fazer.`);
} else {
  const [profile] = await db
    .insert(schema.searchProfiles)
    .values({
      name: "Minha busca",
      state: "DF",
      city: "Brasília",
      regions: ["Taguatinga", "Guará"],
      categories: ["casa"],
      priceMin: 2000,
      priceMax: 4000,
      includeCondoFee: true,
      bedrooms: [2, 3],
    })
    .returning();
  console.log(`Perfil #${profile.id} criado. Ajuste os filtros na sidebar e clique em "Buscar com o agente".`);
}
