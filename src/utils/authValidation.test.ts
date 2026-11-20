import {
  validateEmail,
  validateIdentifier,
  validateLoginPassword,
  validatePassword,
  validateUsername,
} from './authValidation';

describe('validação de nome de usuário', () => {
  it('recusa vazio', () => {
    expect(validateUsername('')).toBe('Escolha um nome de usuário.');
  });

  it('recusa menos de 3 caracteres', () => {
    expect(validateUsername('ab')).toBe('O nome precisa ter ao menos 3 caracteres.');
  });

  it('recusa mais de 20 caracteres', () => {
    expect(validateUsername('a'.repeat(21))).toBe(
      'O nome pode ter no máximo 20 caracteres.',
    );
  });

  it('recusa caractere fora de letra, número e underscore', () => {
    expect(validateUsername('bia silva')).toBe('Use apenas letras, números e _ (underline).');
    expect(validateUsername('bia@silva')).toBe('Use apenas letras, números e _ (underline).');
  });

  it('aceita o que a API aceita', () => {
    expect(validateUsername('bia_2010')).toBeNull();
    expect(validateUsername('Bia')).toBeNull();
  });
});

describe('validação de e-mail', () => {
  it('trata vazio como válido, porque o campo é opcional', () => {
    expect(validateEmail('')).toBeNull();
    expect(validateEmail('   ')).toBeNull();
  });

  it('recusa endereço sem arroba ou sem domínio', () => {
    expect(validateEmail('sem-arroba')).toBe(
      'Confira o e-mail: falta o @ ou o domínio.',
    );
    expect(validateEmail('bia@')).toBe('Confira o e-mail: falta o @ ou o domínio.');
    expect(validateEmail('bia@local')).toBe('Confira o e-mail: falta o @ ou o domínio.');
  });

  it('aceita endereço completo', () => {
    expect(validateEmail('bia@escola.com.br')).toBeNull();
  });
});

describe('validação de senha', () => {
  it('recusa vazio', () => {
    expect(validatePassword('')).toBe('Digite uma senha.');
  });

  it('recusa menos de 8 caracteres', () => {
    expect(validatePassword('Abc123')).toBe('A senha precisa ter ao menos 8 caracteres.');
  });

  it('recusa só números', () => {
    expect(validatePassword('12345678')).toBe('A senha não pode ser só números.');
  });

  it('recusa caractere repetido', () => {
    expect(validatePassword('aaaaaaaa')).toBe(
      'A senha não pode ser um caractere repetido.',
    );
  });

  it('aceita senha forte', () => {
    expect(validatePassword('SenhaForte123')).toBeNull();
  });

  it('no login basta estar preenchida', () => {
    expect(validateLoginPassword('')).toBe('Digite sua senha.');
    expect(validateLoginPassword('123')).toBeNull();
  });
});

describe('validação de identificador', () => {
  it('recusa vazio ou só espaço', () => {
    expect(validateIdentifier('')).toBe('Digite seu usuário ou e-mail.');
    expect(validateIdentifier('  ')).toBe('Digite seu usuário ou e-mail.');
  });

  it('aceita usuário ou e-mail', () => {
    expect(validateIdentifier('bia')).toBeNull();
    expect(validateIdentifier('bia@escola.com')).toBeNull();
  });
});
