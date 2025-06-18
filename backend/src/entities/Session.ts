import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";
import { User } from "./User";

@Entity("session", { schema: "diaberry" })
@Index("IDX_SESSION_TOKEN", ["token"], { unique: true })
@Index("IDX_SESSION_USER", ["user_id"])
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 255 })
  token!: string;

  @Column({ name: "user_id" })
  user_id!: number;

  @Column({ name: "expires_at" })
  expires_at!: Date;

  @Column({ name: "refresh_token", nullable: true })
  refresh_token?: string;

  @Column({ name: "user_agent", nullable: true })
  user_agent?: string;

  @Column({ name: "ip_address", nullable: true })
  ip_address?: string;

  @Column({ name: "is_active", default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => User, user => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "user_id" })
  user!: User;

  // Check if session is expired
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  // Check if session is valid
  isValid(): boolean {
    return this.is_active && !this.isExpired();
  }
}