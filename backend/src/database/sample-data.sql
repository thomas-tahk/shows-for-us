-- Sample data for Shows For Us
-- This file contains sample data for development and testing

-- Insert sample musicals
INSERT INTO musicals (name, description, genre, original_broadway_run) VALUES
('Hamilton', 'The story of America''s Founding Father Alexander Hamilton, an immigrant from the West Indies who became George Washington''s right-hand man during the Revolutionary War and was the new nation''s first Treasury Secretary.', 'Historical Musical', 
 '{"startDate": "2015-08-06", "endDate": null, "theater": "Richard Rodgers Theatre"}'),
('The Lion King', 'The Lion King is a musical drama based on the 1994 Disney animated film of the same name with music by Elton John and lyrics by Tim Rice.', 'Family Musical', 
 '{"startDate": "1997-11-13", "endDate": null, "theater": "Minskoff Theatre"}'),
('Wicked', 'A musical with music and lyrics by Stephen Schwartz and book by Winnie Holzman. It is based on the 1995 Gregory Maguire novel Wicked: The Life and Times of the Wicked Witch of the West.', 'Fantasy Musical', 
 '{"startDate": "2003-10-30", "endDate": null, "theater": "Gershwin Theatre"}'),
('Chicago', 'A musical with music by John Kander, lyrics by Fred Ebb, and book by Ebb and Bob Fosse. Set in Chicago in the jazz age, the musical is based on a 1926 play of the same name.', 'Jazz Musical', 
 '{"startDate": "1996-06-03", "endDate": null, "theater": "Ambassador Theatre"}'),
('The Phantom of the Opera', 'A musical with music by Andrew Lloyd Webber, lyrics by Charles Hart, and a libretto by Lloyd Webber and Richard Stilgoe.', 'Romance Musical', 
 '{"startDate": "1988-01-26", "endDate": "2023-04-16", "theater": "Majestic Theatre"}');

-- Insert sample cast members
INSERT INTO cast_members (name, bio, profile_image) VALUES
('Lin-Manuel Miranda', 'Lin-Manuel Miranda is an American actor, singer, songwriter, rapper, director, producer, and playwright. He created and starred in the Broadway musicals In the Heights and Hamilton.', null),
('Phillipa Soo', 'Phillipa Soo is an American actress and singer. She is best known for originating the role of Eliza Hamilton in the Broadway musical Hamilton.', null),
('Daveed Diggs', 'Daveed Diggs is an American actor, rapper, singer, and songwriter. He is the vocalist of the experimental hip hop group clipping.', null),
('James Monroe Iglehart', 'James Monroe Iglehart is an American actor and singer. He is known for his stage work in Broadway musicals, particularly his Tony Award-winning performance as Genie in Aladdin.', null),
('Idina Menzel', 'Idina Menzel is an American actress, singer, and songwriter. She rose to prominence for her performance as Maureen Johnson in the Broadway musical Rent.', null),
('Kristin Chenoweth', 'Kristin Chenoweth is an American actress and singer, with credits in musical theatre, film, and television.', null);

-- Insert sample venues
INSERT INTO venues (name, address, city, state, zip_code, latitude, longitude, capacity) VALUES
('Richard Rodgers Theatre', '226 W 46th St', 'New York', 'NY', '10036', 40.759776, -73.988483, 1319),
('Minskoff Theatre', '1515 Broadway', 'New York', 'NY', '10036', 40.757874, -73.985574, 1710),
('Gershwin Theatre', '222 W 51st St', 'New York', 'NY', '10019', 40.762421, -73.983618, 1933),
('Chicago Theatre', '175 N State St', 'Chicago', 'IL', '60601', 41.885269, -87.627798, 3600),
('Hollywood Pantages Theatre', '6233 Hollywood Blvd', 'Los Angeles', 'CA', '90028', 34.101969, -118.327904, 2703),
('Kennedy Center Opera House', '2700 F St NW', 'Washington', 'DC', '20566', 38.895865, -77.055107, 2300),
('Orpheum Theatre', '910 Hennepin Ave', 'Minneapolis', 'MN', '55403', 44.975308, -93.278213, 2579);

-- Insert sample productions
INSERT INTO productions (musical_id, name, type, status) VALUES
((SELECT id FROM musicals WHERE name = 'Hamilton'), 'Hamilton - Broadway', 'broadway', 'active'),
((SELECT id FROM musicals WHERE name = 'Hamilton'), 'Hamilton - National Tour', 'touring', 'active'),
((SELECT id FROM musicals WHERE name = 'The Lion King'), 'The Lion King - Broadway', 'broadway', 'active'),
((SELECT id FROM musicals WHERE name = 'The Lion King'), 'The Lion King - National Tour', 'touring', 'active'),
((SELECT id FROM musicals WHERE name = 'Wicked'), 'Wicked - Broadway', 'broadway', 'active'),
((SELECT id FROM musicals WHERE name = 'Wicked'), 'Wicked - National Tour', 'touring', 'active'),
((SELECT id FROM musicals WHERE name = 'Chicago'), 'Chicago - Broadway', 'broadway', 'active'),
((SELECT id FROM musicals WHERE name = 'The Phantom of the Opera'), 'The Phantom of the Opera - Final Broadway Run', 'broadway', 'completed');

-- Insert sample performances
INSERT INTO performances (production_id, venue_id, performance_date, performance_time, availability) VALUES
-- Hamilton Broadway performances
((SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 (SELECT id FROM venues WHERE name = 'Richard Rodgers Theatre'), 
 '2024-08-01', '19:00:00', 'available'),
((SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 (SELECT id FROM venues WHERE name = 'Richard Rodgers Theatre'), 
 '2024-08-01', '14:00:00', 'limited'),
((SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 (SELECT id FROM venues WHERE name = 'Richard Rodgers Theatre'), 
 '2024-08-02', '19:00:00', 'sold-out'),

-- Hamilton National Tour performances
((SELECT id FROM productions WHERE name = 'Hamilton - National Tour'), 
 (SELECT id FROM venues WHERE name = 'Chicago Theatre'), 
 '2024-08-15', '19:30:00', 'available'),
((SELECT id FROM productions WHERE name = 'Hamilton - National Tour'), 
 (SELECT id FROM venues WHERE name = 'Chicago Theatre'), 
 '2024-08-16', '14:00:00', 'available'),
((SELECT id FROM productions WHERE name = 'Hamilton - National Tour'), 
 (SELECT id FROM venues WHERE name = 'Hollywood Pantages Theatre'), 
 '2024-09-01', '20:00:00', 'available'),

-- Lion King performances
((SELECT id FROM productions WHERE name = 'The Lion King - Broadway'), 
 (SELECT id FROM venues WHERE name = 'Minskoff Theatre'), 
 '2024-08-01', '20:00:00', 'available'),
((SELECT id FROM productions WHERE name = 'The Lion King - National Tour'), 
 (SELECT id FROM venues WHERE name = 'Kennedy Center Opera House'), 
 '2024-08-20', '19:30:00', 'available'),

-- Wicked performances
((SELECT id FROM productions WHERE name = 'Wicked - Broadway'), 
 (SELECT id FROM venues WHERE name = 'Gershwin Theatre'), 
 '2024-08-01', '20:00:00', 'limited'),
((SELECT id FROM productions WHERE name = 'Wicked - National Tour'), 
 (SELECT id FROM venues WHERE name = 'Orpheum Theatre'), 
 '2024-08-25', '19:30:00', 'available');

-- Insert sample roles
INSERT INTO roles (cast_member_id, production_id, character_name, role_type) VALUES
-- Hamilton Broadway cast
((SELECT id FROM cast_members WHERE name = 'Lin-Manuel Miranda'), 
 (SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 'Alexander Hamilton', 'lead'),
((SELECT id FROM cast_members WHERE name = 'Phillipa Soo'), 
 (SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 'Eliza Hamilton', 'lead'),
((SELECT id FROM cast_members WHERE name = 'Daveed Diggs'), 
 (SELECT id FROM productions WHERE name = 'Hamilton - Broadway'), 
 'Marquis de Lafayette/Thomas Jefferson', 'supporting'),

-- Lion King cast
((SELECT id FROM cast_members WHERE name = 'James Monroe Iglehart'), 
 (SELECT id FROM productions WHERE name = 'The Lion King - Broadway'), 
 'Simba', 'lead'),

-- Wicked cast
((SELECT id FROM cast_members WHERE name = 'Idina Menzel'), 
 (SELECT id FROM productions WHERE name = 'Wicked - Broadway'), 
 'Elphaba', 'lead'),
((SELECT id FROM cast_members WHERE name = 'Kristin Chenoweth'), 
 (SELECT id FROM productions WHERE name = 'Wicked - Broadway'), 
 'Glinda', 'lead');

-- Insert sample feed items
INSERT INTO feed_items (type, title, description, related_musical_id, published_at) VALUES
('performance_announcement', 'Hamilton Returns to Chicago', 'The critically acclaimed musical Hamilton is returning to Chicago with a brand new cast for a limited engagement.', 
 (SELECT id FROM musicals WHERE name = 'Hamilton'), 
 '2024-07-15 10:00:00'),
('cast_change', 'New Elphaba Cast in Wicked', 'Broadway veteran joins the cast of Wicked as the new Elphaba, bringing fresh energy to the beloved role.', 
 (SELECT id FROM musicals WHERE name = 'Wicked'), 
 '2024-07-10 14:30:00'),
('news', 'Lion King Celebrates 27 Years on Broadway', 'The Lion King continues to roar on Broadway, celebrating another milestone year with record-breaking attendance.', 
 (SELECT id FROM musicals WHERE name = 'The Lion King'), 
 '2024-07-05 09:00:00');