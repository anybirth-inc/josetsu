/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `postal_code` (text)
      - `address` (text, required)
      - `phone` (text)
      - `email` (text)
      - `contract_type` (enum: basic, premium, custom)
      - `snow_removal_area` (numeric)
      - `contract_start_date` (date)
      - `contract_end_date` (date)
      - `billing_amount` (numeric)
      - `lat` (numeric)
      - `lng` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `customers` table
    - Add policies for authenticated users to:
      - Read all customers
      - Create new customers
      - Update their own customers
      - Delete their own customers
*/

-- Create enum type for contract types
CREATE TYPE contract_type AS ENUM ('basic', 'premium ', 'custom');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  postal_code text,
  address text NOT NULL,
  phone text,
  email text,
  contract_type contract_type NOT NULL DEFAULT 'basic',
  snow_removal_area numeric,
  contract_start_date date,
  contract_end_date date,
  billing_amount numeric DEFAULT 0,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth.uid()
    FROM customers
    WHERE id = customers.id
  ));

CREATE POLICY "Users can delete their own customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth.uid()
    FROM customers
    WHERE id = customers.id
  ));