using System.Security.Cryptography;
using System.Text;
using Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public class AesEncryptionService(IOptions<EncryptionOptions> options) : IEncryptionService
{
    private readonly byte[] _key = Convert.FromBase64String(options.Value.Key);

    public string Encrypt(string plaintext)
    {
        if (_key.Length != 32)
            throw new InvalidOperationException("ENCRYPTION_KEY must decode to exactly 32 bytes.");

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();

        using var enc = aes.CreateEncryptor();
        var plain  = Encoding.UTF8.GetBytes(plaintext);
        var cipher = enc.TransformFinalBlock(plain, 0, plain.Length);

        // Layout: [16-byte IV][ciphertext]
        var result = new byte[aes.IV.Length + cipher.Length];
        Buffer.BlockCopy(aes.IV,    0, result, 0,             aes.IV.Length);
        Buffer.BlockCopy(cipher,    0, result, aes.IV.Length, cipher.Length);
        return Convert.ToBase64String(result);
    }

    public string Decrypt(string ciphertext)
    {
        var data   = Convert.FromBase64String(ciphertext);
        var ivSize = 16;
        var iv     = data[..ivSize];
        var cipher = data[ivSize..];

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV  = iv;

        using var dec   = aes.CreateDecryptor();
        var plain = dec.TransformFinalBlock(cipher, 0, cipher.Length);
        return Encoding.UTF8.GetString(plain);
    }
}

public class EncryptionOptions
{
    public string Key { get; set; } = string.Empty;
}
