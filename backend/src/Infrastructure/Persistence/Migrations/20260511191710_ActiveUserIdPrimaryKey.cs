using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ActiveUserIdPrimaryKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ActiveUsers",
                table: "ActiveUsers");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "ActiveUsers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Assign a unique Id to every existing row before adding the PK.
            migrationBuilder.Sql("UPDATE [ActiveUsers] SET [Id] = NEWID()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ActiveUsers",
                table: "ActiveUsers",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ActiveUsers",
                table: "ActiveUsers");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "ActiveUsers");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ActiveUsers",
                table: "ActiveUsers",
                columns: new[] { "SubscriptionId", "MemberId" });
        }
    }
}
