const { initDB, getOne, getAll, runQuery } = require('./db');

async function seed() {
  console.log('Seeding database...');
  await initDB();

  // Seed doctor info
  const existingDoctor = getOne('SELECT id FROM doctor WHERE id = 1');
  if (!existingDoctor) {
    runQuery(`INSERT INTO doctor (id, name, qualifications, specialization, about, experience_years, photo, clinic_name, clinic_address, phone, email, working_hours, map_embed, whatsapp)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Dr. Priyanka Dhanotiya',
        'MBBS, MD (Dermatology, Venereology & Leprosy)',
        'Dermatologist & Skin Specialist',
        'Dr. Priyanka Dhanotiya is a highly skilled and experienced dermatologist dedicated to providing comprehensive skin care solutions. With expertise in both medical and cosmetic dermatology, she offers personalized treatment plans tailored to each patient\'s unique needs.\n\nShe specializes in treating a wide range of skin conditions including acne, eczema, psoriasis, pigmentation disorders, hair loss, and aging skin. Dr. Dhanotiya is also proficient in advanced cosmetic procedures such as laser treatments, chemical peels, Botox, dermal fillers, and PRP therapy.',
        10, null,
        'Dhanotiya Skin & Hair Clinic',
        '[Clinic Address - To Be Updated]',
        '[Phone Number - To Be Updated]',
        '[Email - To Be Updated]',
        'Mon - Sat: 10:00 AM - 2:00 PM, 5:00 PM - 8:00 PM | Sunday: Closed',
        '', ''
      ]
    );
  }

  // Seed services
  const serviceCount = getOne('SELECT COUNT(*) as count FROM services');
  if (serviceCount.count === 0) {
    const services = [
      ['Acne Treatment', 'Advanced acne treatment using the latest techniques to clear skin and prevent scarring. Customized solutions for all types of acne.', 'fa-face-smile', 1],
      ['Skin Rejuvenation', 'Restore your skin\'s youthful glow with our advanced rejuvenation treatments including microdermabrasion and hydrafacials.', 'fa-spa', 2],
      ['Hair Loss Treatment', 'Comprehensive hair loss solutions including PRP therapy, mesotherapy, and medical management for both men and women.', 'fa-head-side', 3],
      ['Laser Treatment', 'State-of-the-art laser treatments for hair removal, skin resurfacing, tattoo removal, and pigmentation correction.', 'fa-bolt', 4],
      ['Chemical Peels', 'Professional chemical peels to improve skin texture, reduce fine lines, treat acne scars, and achieve an even skin tone.', 'fa-droplet', 5],
      ['Anti-Aging Treatment', 'Turn back the clock with our anti-aging treatments including Botox, dermal fillers, thread lifts, and collagen boosting.', 'fa-clock-rotate-left', 6],
      ['Pigmentation Treatment', 'Effective treatments for melasma, dark spots, uneven skin tone using advanced dermatological techniques.', 'fa-sun', 7],
      ['Scar Treatment', 'Advanced scar revision treatments including laser therapy, microneedling, and subcision for acne and surgical scars.', 'fa-bandage', 8],
      ['Botox & Fillers', 'Expert administration of Botox and dermal fillers for wrinkle reduction, facial contouring, and lip enhancement.', 'fa-syringe', 9],
      ['PRP Therapy', 'Platelet-Rich Plasma therapy for hair regrowth, skin rejuvenation using your body\'s own growth factors.', 'fa-vial', 10],
      ['Mole Removal', 'Safe and effective mole removal procedures using advanced techniques with minimal scarring.', 'fa-circle-dot', 11],
      ['Skin Allergy Treatment', 'Diagnosis and treatment of various skin allergies including eczema, urticaria, contact dermatitis.', 'fa-shield-virus', 12]
    ];
    services.forEach(s => {
      runQuery('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)', s);
    });
  }

  // Seed testimonials
  const testimonialCount = getOne('SELECT COUNT(*) as count FROM testimonials');
  if (testimonialCount.count === 0) {
    const testimonials = [
      ['Rahul Sharma', 5, 'Dr. Priyanka Dhanotiya is an excellent dermatologist. She treated my severe acne problem that I had been struggling with for years. Highly recommended!', 'Acne Treatment'],
      ['Sneha Patel', 5, 'I visited Dr. Dhanotiya for my hair fall problem. The PRP therapy she recommended has shown amazing results. My hair fall reduced significantly in 3 months.', 'Hair Loss Treatment'],
      ['Amit Verma', 5, 'The laser treatment for my pigmentation was done very professionally. Results exceeded my expectations. The clinic is very clean and well-maintained.', 'Laser Treatment'],
      ['Priya Joshi', 4, 'I got chemical peel treatment for my dull skin and the results are wonderful. Dr. Dhanotiya is very knowledgeable and patient.', 'Chemical Peels'],
      ['Vikram Singh', 5, 'Best dermatologist! Dr. Dhanotiya treated my psoriasis which other doctors could not manage effectively. Her approach is very scientific. Truly grateful!', 'Skin Treatment']
    ];
    testimonials.forEach(t => {
      runQuery('INSERT INTO testimonials (patient_name, rating, review, treatment) VALUES (?, ?, ?, ?)', t);
    });
  }

  // Seed stats
  const statCount = getOne('SELECT COUNT(*) as count FROM stats');
  if (statCount.count === 0) {
    const stats = [
      ['Years Experience', 10, 'fa-calendar-check', 1],
      ['Happy Patients', 15000, 'fa-face-smile', 2],
      ['Treatments Done', 25000, 'fa-stethoscope', 3],
      ['Awards & Recognition', 12, 'fa-award', 4]
    ];
    stats.forEach(s => {
      runQuery('INSERT INTO stats (label, value, icon, sort_order) VALUES (?, ?, ?, ?)', s);
    });
  }

  // Seed FAQs
  const faqCount = getOne('SELECT COUNT(*) as count FROM faqs');
  if (faqCount.count === 0) {
    const faqs = [
      ['What skin conditions do you treat?', 'We treat a wide range of skin conditions including acne, eczema, psoriasis, pigmentation disorders, fungal infections, hair loss, warts, moles, skin allergies, and aging skin concerns. We also offer cosmetic treatments like Botox, fillers, and laser therapy.', 'General', 1],
      ['How do I book an appointment?', 'You can book an appointment through our website by filling out the appointment form, calling our clinic directly, or sending us a WhatsApp message. We will confirm your appointment within 24 hours.', 'General', 2],
      ['Is laser treatment safe?', 'Yes, laser treatments performed by qualified dermatologists are very safe. We use FDA-approved laser equipment and follow strict safety protocols. Dr. Dhanotiya will assess your skin type and condition before recommending any laser procedure.', 'Treatments', 3],
      ['How many sessions of PRP therapy are needed for hair loss?', 'Typically, 4-6 sessions of PRP therapy are recommended, spaced 3-4 weeks apart. Results start becoming visible after 2-3 sessions. Maintenance sessions every 3-6 months may be recommended for sustained results.', 'Treatments', 4],
      ['What is the cost of consultation?', 'Please contact our clinic for current consultation fees. We offer competitive pricing and ensure you receive the best value for your treatment. Detailed treatment costs are discussed during your consultation.', 'Pricing', 5],
      ['Do chemical peels hurt?', 'Most chemical peels cause only mild tingling or warmth during the procedure. Superficial peels have minimal discomfort, while deeper peels may cause more sensation. Dr. Dhanotiya ensures your comfort throughout the procedure.', 'Treatments', 6],
      ['How long does a Botox treatment last?', 'Botox results typically last 3-6 months. The effects gradually wear off as the muscle action returns. Regular maintenance treatments can help sustain the results. Dr. Dhanotiya will create a personalized treatment schedule for you.', 'Treatments', 7],
      ['Is there any downtime after laser treatment?', 'Downtime varies depending on the type of laser treatment. Some treatments like laser hair removal have no downtime, while skin resurfacing lasers may require 3-7 days of recovery. Dr. Dhanotiya will explain the expected recovery time before your procedure.', 'Treatments', 8]
    ];
    faqs.forEach(f => {
      runQuery('INSERT INTO faqs (question, answer, category, sort_order) VALUES (?, ?, ?, ?)', f);
    });
  }

  // Seed blogs
  const blogCount = getOne('SELECT COUNT(*) as count FROM blogs');
  if (blogCount.count === 0) {
    const blogs = [
      ['10 Daily Skin Care Tips for Glowing Skin', '10-daily-skin-care-tips-for-glowing-skin', 'Discover the essential daily skin care routine recommended by dermatologists for healthy, radiant skin.', '<h3>1. Cleanse Twice Daily</h3><p>Use a gentle, pH-balanced cleanser morning and night. Avoid harsh soaps that strip natural oils from your skin.</p><h3>2. Always Wear Sunscreen</h3><p>Apply broad-spectrum SPF 30+ sunscreen every day, even on cloudy days. Reapply every 2-3 hours when outdoors.</p><h3>3. Moisturize Regularly</h3><p>Choose a moisturizer suited to your skin type. Even oily skin needs hydration. Look for non-comedogenic formulas.</p><h3>4. Stay Hydrated</h3><p>Drink at least 8 glasses of water daily. Proper hydration keeps your skin plump and helps flush out toxins.</p><h3>5. Get Adequate Sleep</h3><p>Aim for 7-8 hours of quality sleep. Your skin repairs and regenerates during sleep.</p><h3>6. Eat a Balanced Diet</h3><p>Include fruits, vegetables, and foods rich in antioxidants, vitamins C and E, and omega-3 fatty acids.</p><h3>7. Avoid Touching Your Face</h3><p>Your hands carry bacteria that can cause breakouts and infections. Keep your hands away from your face.</p><h3>8. Remove Makeup Before Bed</h3><p>Never sleep with makeup on. It clogs pores and accelerates aging. Use a gentle makeup remover.</p><h3>9. Exfoliate Weekly</h3><p>Gentle exfoliation 1-2 times per week removes dead skin cells and promotes cell turnover.</p><h3>10. Consult a Dermatologist</h3><p>Regular skin check-ups help catch problems early. Visit a dermatologist at least once a year for a comprehensive skin evaluation.</p>', 'Skin Care'],
      ['Understanding Acne: Causes, Types, and Treatments', 'understanding-acne-causes-types-treatments', 'Learn about the different types of acne, what causes them, and the most effective treatment options available.', '<h3>What is Acne?</h3><p>Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells. It can appear as whiteheads, blackheads, pimples, or deep cysts.</p><h3>Common Causes</h3><p><strong>Hormonal changes:</strong> Puberty, menstruation, pregnancy, and PCOS can trigger acne.</p><p><strong>Excess oil production:</strong> Overactive sebaceous glands produce too much sebum.</p><p><strong>Bacteria:</strong> P. acnes bacteria thrive in clogged pores and cause inflammation.</p><p><strong>Diet:</strong> High-glycemic foods and dairy may worsen acne in some people.</p><h3>Types of Acne</h3><p><strong>Comedonal:</strong> Blackheads and whiteheads</p><p><strong>Inflammatory:</strong> Red, swollen pimples</p><p><strong>Cystic:</strong> Deep, painful nodules under the skin</p><h3>Treatment Options</h3><p>Treatment depends on the severity and type of acne. Options include topical retinoids, antibiotics, chemical peels, laser therapy, and in severe cases, oral medications like isotretinoin. Consult a dermatologist for a personalized treatment plan.</p>', 'Acne'],
      ['PRP Therapy for Hair Loss: What You Need to Know', 'prp-therapy-hair-loss-guide', 'A comprehensive guide to PRP (Platelet-Rich Plasma) therapy for hair loss treatment and what to expect.', '<h3>What is PRP Therapy?</h3><p>PRP (Platelet-Rich Plasma) therapy is a revolutionary treatment that uses your own blood\'s growth factors to stimulate hair growth. It is a safe, non-surgical procedure with minimal downtime.</p><h3>How Does It Work?</h3><p>A small amount of blood is drawn and processed in a centrifuge to separate the platelet-rich plasma. This concentrated plasma is then injected into the scalp at the level of the hair follicles.</p><h3>Who is a Good Candidate?</h3><p>PRP therapy works best for people with early hair thinning or androgenetic alopecia. It is effective for both men and women experiencing hair loss.</p><h3>What to Expect</h3><p>The procedure takes about 30-45 minutes. Most patients need 4-6 sessions spaced 3-4 weeks apart. Results typically become visible after 2-3 months.</p><h3>Benefits</h3><p>Natural treatment using your own blood, minimal side effects, no surgery required, can be combined with other treatments, and promotes natural hair growth.</p>', 'Hair Care']
    ];
    blogs.forEach(b => {
      runQuery('INSERT INTO blogs (title, slug, excerpt, content, category) VALUES (?, ?, ?, ?, ?)', b);
    });
  }

  console.log('Database seeded successfully!');
}

seed().catch(console.error);
