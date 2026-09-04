DO $$ 
DECLARE
  cat_plats_id UUID := gen_random_uuid();
  cat_begudes_id UUID := gen_random_uuid();
BEGIN
  -- Insertamos la categoría de Platos de Desayuno
  INSERT INTO public.carta_categories (id, name, name_ca, name_en, name_fr, order_index)
  VALUES (cat_plats_id, 'Esmorzars de Forquilla', 'Esmorzars de Forquilla', 'Fork Breakfasts', 'Petits Déjeuners à la Fourchette', 0);

  -- Insertamos la categoría de Bebidas de Desayuno
  INSERT INTO public.carta_categories (id, name, name_ca, name_en, name_fr, order_index)
  VALUES (cat_begudes_id, 'Bebidas de Desayuno', 'Begudes', 'Breakfast Drinks', 'Boissons du Petit Déjeuner', 1);

  -- ==========================================
  -- PLATOS (Solo visibles en desayuno)
  -- ==========================================
  INSERT INTO public.carta_products (category_id, name, name_ca, name_en, name_fr, price, show_in_breakfast, show_in_lunch, show_in_dinner, order_index)
  VALUES 
  (cat_plats_id, 'Cordero a la brasa', 'Xai a la brasa', 'Grilled lamb', 'Agneau grillé', 18.80, true, false, false, 0),
  (cat_plats_id, 'Callos con chorizo, morcilla y jamón ibérico', 'Callos amb xoriç, botifarra negra i Pernil ibèric', 'Tripe with chorizo, black pudding and Iberian ham', 'Tripes au chorizo, boudin noir et jambon ibérique', 11.90, true, false, false, 1),
  (cat_plats_id, 'Meloso de ternera', 'Melós de vedella', 'Tender veal', 'Veau fondant', 12.50, true, false, false, 2),
  (cat_plats_id, 'Butifarra de payés con judías o patatas', 'Botifarra de pagès amb mongetes o patates', 'Traditional sausage with beans or potatoes', 'Saucisse traditionnelle avec haricots ou pommes de terre', 10.95, true, false, false, 3),
  (cat_plats_id, 'Morcilla con judías o patatas', 'Botifarra negra amb mongetes o patates', 'Black pudding with beans or potatoes', 'Boudin noir avec haricots ou pommes de terre', 11.95, true, false, false, 4),
  (cat_plats_id, 'Bacalao con sanfaina', 'Bacallà amb sanfaina', 'Cod with samfaina (vegetable stew)', 'Morue à la samfaina (ratatouille)', 16.90, true, false, false, 5),
  (cat_plats_id, 'Huevos fritos con panceta y patatas', 'Ous ferrats amb cansalada i patates', 'Fried eggs with bacon and potatoes', 'Œufs au plat avec poitrine de porc et pommes de terre', 9.75, true, false, false, 6);

  -- ==========================================
  -- BEBIDAS (Solo visibles en desayuno)
  -- ==========================================
  INSERT INTO public.carta_products (category_id, name, name_ca, name_en, name_fr, price, show_in_breakfast, show_in_lunch, show_in_dinner, order_index)
  VALUES 
  (cat_begudes_id, 'Porrón de vino', 'Porró de vi', 'Wine in a porron', 'Vin en porrón', 6.90, true, false, false, 0),
  (cat_begudes_id, 'Gaseosa 0,5L', 'Gasosa 0,5L', 'Soda 0.5L', 'Limonade 0,5L', 2.90, true, false, false, 1),
  (cat_begudes_id, 'Refresco', 'Refresc', 'Soft drink', 'Boisson gazeuse', 2.90, true, false, false, 2),
  (cat_begudes_id, 'Cerveza', 'Cervesa', 'Beer', 'Bière', 2.90, true, false, false, 3),
  (cat_begudes_id, 'Agua 1/2L', 'Aigua 1/2L', 'Water 1/2L', 'Eau 1/2L', 2.05, true, false, false, 4);

END $$;
