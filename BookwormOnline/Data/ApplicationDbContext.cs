using BookwormOnline.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Linq;

namespace BookwormOnline.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Enforce unique email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure PreviousPasswords to store a list of strings (comma-separated) 
            // and specify a ValueComparer so EF can detect changes correctly.
            modelBuilder.Entity<User>()
                .Property(u => u.PreviousPasswords)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', System.StringSplitOptions.RemoveEmptyEntries).ToList()
                )
                .Metadata
                .SetValueComparer(
                    new ValueComparer<List<string>>(
                        (c1, c2) => c1.SequenceEqual(c2),
                        c => c.Aggregate(19, (hash, item) => hash * 31 + (item != null ? item.GetHashCode() : 0)),
                        c => c.ToList() // Ensure a deep copy is made so EF can detect changes
                    )
                );

            // Example index on AuditLog
            modelBuilder.Entity<AuditLog>()
                .HasIndex(a => a.Timestamp);
        }
    }
}
