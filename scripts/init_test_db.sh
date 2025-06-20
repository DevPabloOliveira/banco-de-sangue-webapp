mysql -u root -proot -e "DROP DATABASE IF EXISTS banco_sangue_test;
CREATE DATABASE banco_sangue_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;"

mysql -u root -proot banco_sangue_test < schema_only.sql
mysql -u root -proot banco_sangue_test < scripts/seed_test_db.sql
