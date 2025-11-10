public class User
{
    public ulong Id { get; set; }
    public string AccountType { get; set; } = null!; // pf | pj
    public string DocumentType { get; set; } = null!; // CPF | CNPJ
    public string DocumentNumber { get; set; } = null!;
    public string LegalName { get; set; } = null!;
    public string? DisplayName { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? PasswordHash { get; set; } // won't be returned to client
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // address
    public string? AddressStreet { get; set; }
    public string? AddressNumber { get; set; }
    public string? AddressComplement { get; set; }
    public string? AddressNeighborhood { get; set; }
    public string? AddressCity { get; set; }
    public string? AddressState { get; set; }
    public string? AddressZip { get; set; }
}
