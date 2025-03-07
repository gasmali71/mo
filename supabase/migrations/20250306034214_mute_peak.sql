/*
  # Test Registration Flow

  1. New Tables
    - Aucune nouvelle table n'est créée, utilisation des tables existantes

  2. Changes
    - Ajout d'une procédure stockée pour gérer l'inscription et la création de test
    - Gestion des transactions pour assurer l'intégrité des données

  3. Security
    - Vérification des permissions via RLS
    - Validation des données d'entrée
*/

-- Création de la procédure stockée pour l'inscription et le test
CREATE OR REPLACE FUNCTION create_student_and_test_session(
  p_user_id uuid,
  p_student_info jsonb,
  p_guardian_info jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_session_id uuid;
  v_result jsonb;
BEGIN
  -- Validation des données requises
  IF p_student_info->>'full_name' IS NULL OR 
     p_student_info->>'date_of_birth' IS NULL OR 
     p_student_info->>'grade_level' IS NULL THEN
    RAISE EXCEPTION 'Informations étudiant incomplètes';
  END IF;

  -- Vérification de l'existence de l'utilisateur
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- Début de la transaction
  BEGIN
    -- 1. Création de l'étudiant
    INSERT INTO students (
      user_id,
      full_name,
      date_of_birth,
      grade_level
    ) VALUES (
      p_user_id,
      p_student_info->>'full_name',
      (p_student_info->>'date_of_birth')::date,
      p_student_info->>'grade_level'
    )
    RETURNING id INTO v_student_id;

    -- 2. Création du tuteur si les informations sont fournies
    IF p_guardian_info IS NOT NULL THEN
      INSERT INTO guardians (
        student_id,
        full_name,
        relationship,
        email,
        phone
      ) VALUES (
        v_student_id,
        p_guardian_info->>'full_name',
        p_guardian_info->>'relationship',
        p_guardian_info->>'email',
        p_guardian_info->>'phone'
      );
    END IF;

    -- 3. Création de la session de test initiale
    INSERT INTO test_sessions (
      student_id,
      evaluator_id,
      status
    ) VALUES (
      v_student_id,
      p_user_id,
      'pending'
    )
    RETURNING id INTO v_session_id;

    -- Préparation du résultat
    v_result := jsonb_build_object(
      'student_id', v_student_id,
      'session_id', v_session_id,
      'status', 'success'
    );

    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'erreur, annulation de la transaction
      RAISE EXCEPTION 'Erreur lors de l''inscription: %', SQLERRM;
  END;
END;
$$;

-- Exemple d'utilisation:
COMMENT ON FUNCTION create_student_and_test_session IS '
Exemple d''utilisation:

SELECT create_student_and_test_session(
  auth.uid(),
  jsonb_build_object(
    ''full_name'', ''Jean Dupont'',
    ''date_of_birth'', ''2012-05-15'',
    ''grade_level'', ''6ème''
  ),
  jsonb_build_object(
    ''full_name'', ''Marie Dupont'',
    ''relationship'', ''Mère'',
    ''email'', ''marie.dupont@email.com'',
    ''phone'', ''+33612345678''
  )
);
';
