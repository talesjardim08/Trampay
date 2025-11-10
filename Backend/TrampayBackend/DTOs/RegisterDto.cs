public record registerDto(
    string AccountType,
    string DocumentType,
    string DocumentNumber,
    string LegalName,
    string? DisplayName,
    DateTime? BirthDate,
    string? Email,
    string? Phone,
    string? AddressStreet,
    string? AddressNumber,
    string? AddressComplement,
    string? AddressNeighborhood,
    string? AddressCity,
    string? AddressState,
    string? AddressZip,
    string Senha
);
