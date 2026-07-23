using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class ServicesForm : Form
    {

        public bool IsEmbedded { get; set; } = false;
        public ServicesForm()
        {
            InitializeComponent();

            LoadServices();

        }

        private void LoadServices(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();
                    string query = @"
                                SELECT
                                ServiceID,
                                ServiceName AS `Service`,
                                TotalMembers AS `Total Members`
                            FROM ServiceStatistics
                            WHERE
                                ServiceName LIKE @keyword
                            ORDER BY ServiceName;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);
                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@keyword",
                        "%" + keyword + "%");

                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    dgvServices.DataSource = dt;
                    FormatDataGridView();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the list of services.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        private void FormatDataGridView()
        {
            if (dgvServices.Columns.Contains("ServiceID"))
            {
                dgvServices.Columns["ServiceID"].Visible = false;
            }
            dgvServices.Columns["Total Members"].DefaultCellStyle.Alignment =
    DataGridViewContentAlignment.MiddleCenter;

            dgvServices.Columns["Total Members"].HeaderCell.Style.Alignment =
                DataGridViewContentAlignment.MiddleCenter;
            dgvServices.ReadOnly = true;

            dgvServices.MultiSelect = false;

            dgvServices.SelectionMode =
                DataGridViewSelectionMode.FullRowSelect;

            dgvServices.AllowUserToAddRows = false;

            dgvServices.AllowUserToDeleteRows = false;

            dgvServices.AllowUserToResizeRows = false;

            dgvServices.RowHeadersVisible = false;

            dgvServices.AutoSizeColumnsMode =
                DataGridViewAutoSizeColumnsMode.Fill;

            dgvServices.Columns["Service"].FillWeight = 220;
            dgvServices.Columns["Total Members"].FillWeight = 80;
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadServices(txtSearch.Text.Trim());
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            txtSearch.Clear();

            LoadServices();
        }

        private void dgvServices_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0)
            {
                return;
            }

            int serviceID = Convert.ToInt32(
                dgvServices.Rows[e.RowIndex].Cells["ServiceID"].Value);

            using (ServiceMembersForm serviceMembersForm =
                new ServiceMembersForm(serviceID))
            {
                serviceMembersForm.ShowDialog();
            }


        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            if (this.ParentForm is Dashboard dashboard)
            {
                dashboard.ShowHome();
            }
        }

        private void ServicesForm_Shown(object sender, EventArgs e)
        {
            if (!IsEmbedded)
                return;

            pnlHeader.Visible = false;
        }
    }
}
